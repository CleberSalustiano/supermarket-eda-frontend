import { ApiClientError } from '@supermarket/api-sdk';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recentProductsStorageKey, type RecentProduct } from '../features/management/lib/recent-products';
import { renderApp, testConfig } from './render-app';

const mocks = vi.hoisted(() => ({
  fetchServiceHealth: vi.fn(),
  registerManagementProduct: vi.fn(),
  updateManagementProductPrice: vi.fn(),
  scanCheckoutCatalogItemByBarcode: vi.fn(),
  registerManagementEmployee: vi.fn(),
  listManagementEmployees: vi.fn(),
  deactivateManagementEmployee: vi.fn(),
  changeManagementEmployeePin: vi.fn(),
  generateProfitAndLossReport: vi.fn()
}));

vi.mock('@supermarket/api-sdk', async () => {
  const actual = await vi.importActual<typeof import('@supermarket/api-sdk')>('@supermarket/api-sdk');

  return { ...actual, ...mocks };
});

const productId = '0b4f3405-a406-4bbd-b4fe-ec85f7765d20';
const recent: RecentProduct = {
  productId,
  name: 'Café Arábica 1kg',
  barcode: '7891234567890',
  unitOfMeasure: 'UN',
  currentPrice: 22.9,
  updatedAt: '2026-11-22T12:00:00.000Z'
};

function seedRecents(): void {
  window.localStorage.setItem(recentProductsStorageKey(testConfig.tenantId), JSON.stringify([recent]));
}

function submitPriceButton(): HTMLElement {
  const form = screen.getByLabelText('Novo preço').closest('form')!;

  return within(form).getByRole('button', { name: 'Alterar preço' });
}

function apiError(statusCode: number, message: string): ApiClientError {
  return new ApiClientError(message, statusCode, {
    statusCode,
    message,
    path: '/x',
    correlationId: 'corr-1',
    timestamp: '2026-11-22T12:00:00.000Z'
  });
}

describe('Management application', () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.listManagementEmployees.mockResolvedValue({ items: [], total: 0, limit: 200, offset: 0 });
    mocks.fetchServiceHealth.mockResolvedValue({ serviceName: 'management-service', status: 'ok', timestamp: 'x' });
    mocks.registerManagementProduct.mockResolvedValue({
      productId,
      tenantId: testConfig.tenantId,
      name: 'Café Arábica 1kg',
      barcode: '7891234567890',
      unitOfMeasure: 'UN',
      currentPrice: 22.9,
      active: true,
      eventPublicationStatus: 'published'
    });
    mocks.updateManagementProductPrice.mockResolvedValue({
      productId,
      tenantId: testConfig.tenantId,
      barcode: '7891234567890',
      name: 'Café Arábica 1kg',
      unitOfMeasure: 'UN',
      currentPrice: 24.9,
      previousPrice: 22.9,
      active: true,
      eventPublicationStatus: 'published'
    });
  });

  it('registers a product with a comma decimal and remembers it', async () => {
    const user = userEvent.setup();

    renderApp();

    await user.type(screen.getByLabelText('Nome do produto'), 'Café Arábica 1kg');
    await user.type(screen.getAllByLabelText('Código de barras')[0]!, '7891234567890');
    await user.type(screen.getByLabelText('Preço de venda'), '22,90');
    await user.click(screen.getByRole('button', { name: 'Cadastrar produto' }));

    await screen.findByText('Produto cadastrado: Café Arábica 1kg.');
    expect(screen.getByText('Para vender este produto no caixa, altere o preço uma vez.')).toBeInTheDocument();
    expect(mocks.registerManagementProduct).toHaveBeenCalledWith(
      {
        tenantId: testConfig.tenantId,
        name: 'Café Arábica 1kg',
        barcode: '7891234567890',
        unitOfMeasure: 'UN',
        price: 22.9
      },
      { baseUrl: 'http://localhost:3003' }
    );

    const recents = screen.getByRole('heading', { name: 'Recentes neste navegador' }).closest('section')!;

    expect(within(recents).getByText('Café Arábica 1kg')).toBeInTheDocument();
  });

  it('keeps recents across a re-render and survives failing storage', () => {
    seedRecents();

    const first = renderApp();

    expect(screen.getAllByText('Café Arábica 1kg').length).toBeGreaterThan(0);
    first.unmount();

    renderApp();
    expect(screen.getAllByText('Café Arábica 1kg').length).toBeGreaterThan(0);
  });

  it('does not crash when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });

    renderApp();

    expect(screen.getByText('Os produtos que você cadastrar ou alterar aparecem aqui.')).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it('changes the price of a recent product', async () => {
    const user = userEvent.setup();

    seedRecents();
    renderApp();

    await user.selectOptions(screen.getByLabelText('Produto'), productId);
    await user.type(screen.getByLabelText('Novo preço'), '24,90');
    await user.click(submitPriceButton());

    await screen.findByText(/Preço alterado: Café Arábica 1kg, de .*22,90 para .*24,90\./);
    expect(mocks.updateManagementProductPrice).toHaveBeenCalledWith(
      { tenantId: testConfig.tenantId, productId, price: 24.9 },
      { baseUrl: 'http://localhost:3003' }
    );
  });

  it('finds a product by barcode through the checkout catalog and changes its price', async () => {
    const user = userEvent.setup();

    mocks.scanCheckoutCatalogItemByBarcode.mockResolvedValue({
      productId,
      tenantId: testConfig.tenantId,
      barcode: '7891234567890',
      name: 'Café Arábica 1kg',
      unitOfMeasure: 'UN',
      unitPrice: 22.9,
      active: true,
      priceUpdatedAt: '2026-11-22T12:00:00.000Z'
    });
    renderApp();

    await user.type(screen.getByLabelText('Buscar pelo código de barras'), '7891234567890');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    await screen.findByText(/Preço atual no caixa:/);
    expect(mocks.scanCheckoutCatalogItemByBarcode).toHaveBeenCalledWith(
      { tenantId: testConfig.tenantId, barcode: '7891234567890' },
      { baseUrl: 'http://localhost:3001' }
    );

    await user.type(screen.getByLabelText('Novo preço'), '24,90');
    await user.click(submitPriceButton());
    await screen.findByText(/Preço alterado:/);
    expect(mocks.updateManagementProductPrice).toHaveBeenCalledWith(
      { tenantId: testConfig.tenantId, productId, price: 24.9 },
      { baseUrl: 'http://localhost:3003' }
    );
  });

  it('explains when the barcode is not in the checkout catalog', async () => {
    const user = userEvent.setup();

    mocks.scanCheckoutCatalogItemByBarcode.mockRejectedValue(apiError(404, 'Not found'));
    renderApp();

    await user.type(screen.getByLabelText('Buscar pelo código de barras'), '000111');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    await screen.findByText('Nenhum produto com esse código no caixa. Escolha um recente ou informe o ID.');
  });

  it('explains when the new price equals the current one', async () => {
    const user = userEvent.setup();

    seedRecents();
    mocks.updateManagementProductPrice.mockRejectedValue(
      apiError(400, 'New price must differ from the current price')
    );
    renderApp();

    await user.selectOptions(screen.getByLabelText('Produto'), productId);
    await user.type(screen.getByLabelText('Novo preço'), '22,90');
    await user.click(submitPriceButton());

    await screen.findByText('O novo preço precisa ser diferente do atual.');
  });

  it('navigates between the three sections and redirects the root to products', async () => {
    const user = userEvent.setup();

    renderApp({ route: '/' });

    expect(await screen.findByRole('heading', { level: 1, name: 'Produtos' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Funcionários' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Funcionários' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Resultado' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Resultado' })).toBeInTheDocument();
  });

  it('shows no showcase content', () => {
    renderApp();

    for (const text of [/Healthy/i, /Reset demo tenant/i, /route inventory/i, /MVP/i, /Tenant id/i]) {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
  });

  it('shows the connection banner only when the health check fails', async () => {
    renderApp();
    await screen.findByRole('heading', { level: 1, name: 'Produtos' });
    expect(screen.queryByText(/Sem conexão com o servidor da gestão/)).not.toBeInTheDocument();
  });

  it('shows the connection banner when health fails', async () => {
    mocks.fetchServiceHealth.mockRejectedValue(new Error('down'));
    renderApp();

    expect(await screen.findByText(/Sem conexão com o servidor da gestão/)).toBeInTheDocument();
  });

  it('switches to English with English formatting', async () => {
    const user = userEvent.setup();

    seedRecents();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Preferências' }));
    await user.click(screen.getByRole('radio', { name: 'English' }));

    expect((await screen.findAllByText('Register product')).length).toBeGreaterThan(0);
    expect(screen.getByText('R$22.90')).toBeInTheDocument();
  });

  describe('employees', () => {
    const employeeId = '3c1a5f0e-1111-4222-8333-444455556666';
    const otherId = '4d2b6a1f-2222-4333-9444-555566667777';
    const pin = '2468';
    const baseUrl = { baseUrl: 'http://localhost:3003' };
    const maria = {
      employeeId,
      tenantId: testConfig.tenantId,
      employeeCode: 'MANAGER-01',
      fullName: 'Maria Souza',
      role: 'MANAGER',
      active: true,
      deactivatedAt: null,
      createdAt: '2026-11-20T12:00:00.000Z',
      updatedAt: '2026-11-20T12:00:00.000Z'
    };
    const joao = {
      ...maria,
      employeeId: otherId,
      employeeCode: 'CASHIER-01',
      fullName: 'João Lima',
      role: 'CASHIER',
      active: false,
      deactivatedAt: '2026-11-22T15:30:00.000Z'
    };

    function listOf(items: unknown[], total = items.length) {
      return { items, total, limit: 200, offset: 0 };
    }

    async function fillEmployee(user: ReturnType<typeof userEvent.setup>): Promise<void> {
      await user.type(screen.getByLabelText('Código do funcionário'), 'CASHIER-02');
      await user.type(screen.getByLabelText('Nome completo'), 'Maria Souza');
      await user.selectOptions(screen.getByLabelText('Função'), 'MANAGER');
      await user.type(screen.getByLabelText('PIN'), '123456');
    }

    function storedValues(): string {
      return Object.keys(window.localStorage)
        .map((key) => window.localStorage.getItem(key) ?? '')
        .join('|');
    }

    beforeEach(() => {
      mocks.listManagementEmployees.mockResolvedValue(listOf([maria, joao]));
      mocks.registerManagementEmployee.mockResolvedValue({
        employeeId,
        tenantId: testConfig.tenantId,
        employeeCode: 'CASHIER-02',
        fullName: 'Maria Souza',
        role: 'MANAGER',
        active: true,
        eventPublicationStatus: 'published'
      });
    });

    it('lists employees from the service with their status and no recents', async () => {
      renderApp({ route: '/funcionarios' });

      expect(await screen.findByText('MANAGER-01')).toBeInTheDocument();
      expect(mocks.listManagementEmployees).toHaveBeenCalledWith(
        { tenantId: testConfig.tenantId, status: 'all', limit: 200 },
        expect.objectContaining(baseUrl)
      );
      expect(screen.getByText('Ativo')).toBeInTheDocument();
      expect(screen.getByText(/^Inativo desde /)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Trocar PIN: João Lima' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Desativar: João Lima' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Desativar: Maria Souza' })).toBeEnabled();
    });

    it('shows the empty state', async () => {
      mocks.listManagementEmployees.mockResolvedValue(listOf([]));
      renderApp({ route: '/funcionarios' });

      expect(await screen.findByText('Nenhum funcionário cadastrado.')).toBeInTheDocument();
    });

    it('shows a footnote when there are more employees than listed', async () => {
      mocks.listManagementEmployees.mockResolvedValue(listOf([maria], 250));
      renderApp({ route: '/funcionarios' });

      expect(await screen.findByText('Mostrando 1 de 250.')).toBeInTheDocument();
    });

    it('shows the loading state before the list arrives', async () => {
      mocks.listManagementEmployees.mockReturnValue(new Promise(() => undefined));
      renderApp({ route: '/funcionarios' });

      expect(await screen.findByRole('heading', { name: 'Funcionários cadastrados' })).toBeInTheDocument();
      expect(screen.queryByText('Nenhum funcionário cadastrado.')).not.toBeInTheDocument();
      expect(screen.queryByText('Não foi possível carregar os funcionários.')).not.toBeInTheDocument();
    });

    it('shows an error with retry and recovers', async () => {
      const user = userEvent.setup();

      mocks.listManagementEmployees.mockRejectedValueOnce(apiError(500, 'boom'));
      renderApp({ route: '/funcionarios' });

      expect(await screen.findByText('Não foi possível carregar os funcionários.')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));

      expect(await screen.findByText('MANAGER-01')).toBeInTheDocument();
    });

    it('registers an employee, refetches the list, clears the PIN and never stores it', async () => {
      const user = userEvent.setup();

      renderApp({ route: '/funcionarios' });
      await screen.findByText('MANAGER-01');
      expect(screen.getByLabelText('PIN')).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText('PIN')).toHaveAttribute('autocomplete', 'new-password');
      await fillEmployee(user);
      await user.click(screen.getByRole('button', { name: 'Cadastrar funcionário' }));

      await screen.findByText('Funcionário cadastrado: Maria Souza.');
      expect(mocks.registerManagementEmployee).toHaveBeenCalledWith(
        { tenantId: testConfig.tenantId, employeeCode: 'CASHIER-02', fullName: 'Maria Souza', role: 'MANAGER', pin: '123456' },
        { baseUrl: 'http://localhost:3003' }
      );
      expect(screen.getByLabelText('PIN')).toHaveValue('');
      expect(storedValues()).not.toContain('123456');
      await vi.waitFor(() => expect(mocks.listManagementEmployees).toHaveBeenCalledTimes(2));
    });

    it('explains a duplicate employee code', async () => {
      const user = userEvent.setup();

      mocks.registerManagementEmployee.mockRejectedValue(apiError(409, 'Conflict'));
      renderApp({ route: '/funcionarios' });
      await fillEmployee(user);
      await user.click(screen.getByRole('button', { name: 'Cadastrar funcionário' }));

      await screen.findByText('Já existe um funcionário com o código CASHIER-02.');
    });

    it('copies the employee id to the clipboard', async () => {
      const user = userEvent.setup();

      renderApp({ route: '/funcionarios' });
      await screen.findByText('MANAGER-01');
      const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

      await user.click(screen.getByRole('button', { name: 'Copiar ID de Maria Souza' }));

      expect(writeText).toHaveBeenCalledWith(employeeId);
      expect(await screen.findByText('ID copiado')).toBeInTheDocument();
    });

    it('shows the fallback hint when the clipboard is unavailable', async () => {
      const user = userEvent.setup();

      renderApp({ route: '/funcionarios' });
      await screen.findByText('MANAGER-01');
      vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));

      await user.click(screen.getByRole('button', { name: 'Copiar ID de Maria Souza' }));

      expect(await screen.findByText('Copie o ID selecionado.')).toBeInTheDocument();
    });

    describe('deactivation', () => {
      async function openDialog(user: ReturnType<typeof userEvent.setup>) {
        renderApp({ route: '/funcionarios' });
        await screen.findByText('MANAGER-01');
        await user.click(screen.getByRole('button', { name: 'Desativar: Maria Souza' }));

        return screen.findByRole('dialog', { name: 'Desativar funcionário' });
      }

      it('asks for confirmation, deactivates and refetches', async () => {
        const user = userEvent.setup();

        mocks.deactivateManagementEmployee.mockResolvedValue({ ...maria, active: false, deactivatedAt: '2026-11-23T10:00:00.000Z' });
        const dialog = await openDialog(user);

        expect(
          within(dialog).getByText(
            'Maria Souza (MANAGER-01) não poderá mais aprovar cancelamentos no caixa. Esta ação não pode ser desfeita aqui.'
          )
        ).toBeInTheDocument();
        await user.click(within(dialog).getByRole('button', { name: 'Desativar' }));

        expect(await screen.findByText('Maria Souza foi desativado.')).toBeInTheDocument();
        expect(mocks.deactivateManagementEmployee).toHaveBeenCalledWith(
          { tenantId: testConfig.tenantId, employeeId },
          expect.objectContaining(baseUrl)
        );
        await vi.waitFor(() => expect(mocks.listManagementEmployees).toHaveBeenCalledTimes(2));
        expect(screen.queryByRole('dialog', { name: 'Desativar funcionário' })).not.toBeInTheDocument();
      });

      it('sends nothing when the user goes back', async () => {
        const user = userEvent.setup();
        const dialog = await openDialog(user);

        await user.click(within(dialog).getByRole('button', { name: 'Voltar' }));

        expect(mocks.deactivateManagementEmployee).not.toHaveBeenCalled();
        expect(screen.queryByRole('dialog', { name: 'Desativar funcionário' })).not.toBeInTheDocument();
      });

      it('explains a 409 and keeps the dialog open', async () => {
        const user = userEvent.setup();

        mocks.deactivateManagementEmployee.mockRejectedValue(apiError(409, 'Conflict'));
        const dialog = await openDialog(user);

        await user.click(within(dialog).getByRole('button', { name: 'Desativar' }));

        expect(await screen.findByText('Este funcionário já está inativo.')).toBeInTheDocument();
        expect(screen.getByRole('dialog', { name: 'Desativar funcionário' })).toBeInTheDocument();
      });

      it('disables the confirmation while the request is pending', async () => {
        const user = userEvent.setup();

        mocks.deactivateManagementEmployee.mockReturnValue(new Promise(() => undefined));
        const dialog = await openDialog(user);

        await user.click(within(dialog).getByRole('button', { name: 'Desativar' }));

        await vi.waitFor(() => expect(within(dialog).getByRole('button', { name: 'Desativar' })).toBeDisabled());
      });
    });

    describe('PIN change', () => {
      async function openDialog(user: ReturnType<typeof userEvent.setup>) {
        renderApp({ route: '/funcionarios' });
        await screen.findByText('MANAGER-01');
        await user.click(screen.getByRole('button', { name: 'Trocar PIN: Maria Souza' }));

        return screen.findByRole('dialog', { name: 'Trocar o PIN de Maria Souza' });
      }

      it('has masked numeric fields', async () => {
        const dialog = await openDialog(userEvent.setup());

        for (const label of ['Novo PIN', 'Confirme o novo PIN']) {
          const field = within(dialog).getByLabelText(label);

          expect(field).toHaveAttribute('type', 'password');
          expect(field).toHaveAttribute('inputmode', 'numeric');
          expect(field).toHaveAttribute('autocomplete', 'new-password');
          expect(field).toHaveAttribute('maxlength', '12');
        }
      });

      it('rejects mismatching and short PINs without sending anything', async () => {
        const user = userEvent.setup();
        const dialog = await openDialog(user);

        await user.type(within(dialog).getByLabelText('Novo PIN'), pin);
        await user.type(within(dialog).getByLabelText('Confirme o novo PIN'), '9999');
        await user.click(within(dialog).getByRole('button', { name: 'Salvar PIN' }));
        expect(await within(dialog).findByText('Os dois PINs precisam ser iguais.')).toBeInTheDocument();

        await user.clear(within(dialog).getByLabelText('Novo PIN'));
        await user.clear(within(dialog).getByLabelText('Confirme o novo PIN'));
        await user.type(within(dialog).getByLabelText('Novo PIN'), '12');
        await user.type(within(dialog).getByLabelText('Confirme o novo PIN'), '12');
        await user.click(within(dialog).getByRole('button', { name: 'Salvar PIN' }));
        expect(await within(dialog).findByText('O PIN precisa ter de 4 a 12 dígitos.')).toBeInTheDocument();

        expect(mocks.changeManagementEmployeePin).not.toHaveBeenCalled();
      });

      it('sends the exact payload, reports success, never stores the PIN and clears the fields on reopening', async () => {
        const user = userEvent.setup();

        mocks.changeManagementEmployeePin.mockResolvedValue({
          employeeId,
          tenantId: testConfig.tenantId,
          employeeCode: 'MANAGER-01',
          pinChangedAt: '2026-11-23T10:00:00.000Z'
        });
        const dialog = await openDialog(user);

        await user.type(within(dialog).getByLabelText('Novo PIN'), pin);
        await user.type(within(dialog).getByLabelText('Confirme o novo PIN'), pin);
        expect(storedValues()).not.toContain(pin);
        await user.click(within(dialog).getByRole('button', { name: 'Salvar PIN' }));

        expect(
          await screen.findByText(
            'PIN de Maria Souza alterado. Bloqueios por tentativas erradas deste código foram liberados.'
          )
        ).toBeInTheDocument();
        expect(mocks.changeManagementEmployeePin).toHaveBeenCalledWith(
          { tenantId: testConfig.tenantId, employeeId, pin },
          expect.objectContaining(baseUrl)
        );
        expect(storedValues()).not.toContain(pin);

        await user.click(screen.getByRole('button', { name: 'Trocar PIN: Maria Souza' }));
        const reopened = await screen.findByRole('dialog', { name: 'Trocar o PIN de Maria Souza' });

        expect(within(reopened).getByLabelText('Novo PIN')).toHaveValue('');
        expect(within(reopened).getByLabelText('Confirme o novo PIN')).toHaveValue('');
      });

      it('explains a rejected PIN (400)', async () => {
        const user = userEvent.setup();

        mocks.changeManagementEmployeePin.mockRejectedValue(apiError(400, 'same'));
        const dialog = await openDialog(user);

        await user.type(within(dialog).getByLabelText('Novo PIN'), pin);
        await user.type(within(dialog).getByLabelText('Confirme o novo PIN'), pin);
        await user.click(within(dialog).getByRole('button', { name: 'Salvar PIN' }));

        expect(
          await screen.findByText('PIN não aceito. Use de 4 a 12 dígitos, diferente do PIN atual.')
        ).toBeInTheDocument();
      });

      it('explains an inactive employee (409)', async () => {
        const user = userEvent.setup();

        mocks.changeManagementEmployeePin.mockRejectedValue(apiError(409, 'inactive'));
        const dialog = await openDialog(user);

        await user.type(within(dialog).getByLabelText('Novo PIN'), pin);
        await user.type(within(dialog).getByLabelText('Confirme o novo PIN'), pin);
        await user.click(within(dialog).getByRole('button', { name: 'Salvar PIN' }));

        expect(await screen.findByText('Funcionário inativo não pode trocar o PIN.')).toBeInTheDocument();
      });

      it('sends nothing when the user goes back', async () => {
        const user = userEvent.setup();
        const dialog = await openDialog(user);

        await user.click(within(dialog).getByRole('button', { name: 'Voltar' }));

        expect(mocks.changeManagementEmployeePin).not.toHaveBeenCalled();
      });
    });

    it('renders the list and the deactivation dialog in English', async () => {
      const user = userEvent.setup();

      renderApp({ route: '/funcionarios', locale: 'en' });
      await screen.findByText('MANAGER-01');
      await user.click(screen.getByRole('button', { name: 'Deactivate: Maria Souza' }));

      expect(await screen.findByRole('dialog', { name: 'Deactivate employee' })).toBeInTheDocument();
    });
  });

  describe('results', () => {
    const report = {
      tenantId: testConfig.tenantId,
      fromDate: '2026-11-01',
      toDate: '2026-11-22',
      revenueNetTotal: 12345.6,
      inventoryLossTotal: 210,
      profitAndLossTotal: 12135.6,
      netSalesCount: 132,
      soldItemsQuantity: 410,
      lossEventsCount: 3,
      lossItemsQuantity: 12,
      days: [
        {
          businessDate: '2026-11-21',
          revenueNetTotal: 100,
          inventoryLossTotal: 150,
          profitAndLossTotal: -50,
          netSalesCount: 4
        }
      ]
    };

    function setDates(from: string, to: string, labels: [string, string] = ['De', 'Até']): void {
      fireEvent.change(screen.getByLabelText(labels[0]), { target: { value: from } });
      fireEvent.change(screen.getByLabelText(labels[1]), { target: { value: to } });
    }

    it('generates the statement with BRL values', async () => {
      const user = userEvent.setup();

      mocks.generateProfitAndLossReport.mockResolvedValue(report);
      renderApp({ route: '/resultado' });
      setDates('2026-11-01', '2026-11-22');
      await user.click(screen.getByRole('button', { name: 'Gerar relatório' }));

      expect(await screen.findByRole('heading', { name: 'Resultado de 01/11/2026 a 22/11/2026' })).toBeInTheDocument();
      expect(mocks.generateProfitAndLossReport).toHaveBeenCalledWith(
        { tenantId: testConfig.tenantId, fromDate: '2026-11-01', toDate: '2026-11-22' },
        { baseUrl: 'http://localhost:3003' }
      );
      expect(screen.getByTestId('result-total')).toHaveTextContent(/R\$\s12\.135,60/);
      expect(screen.getByTestId('result-total')).toHaveClass('text-go');
      expect(screen.getByText('132 vendas, 410 itens vendidos, 3 registros de perda, 12 itens perdidos')).toBeInTheDocument();
      expect(screen.getByRole('table', { name: 'Por dia' })).toBeInTheDocument();
    });

    it('marks a negative result with the stop color', async () => {
      const user = userEvent.setup();

      mocks.generateProfitAndLossReport.mockResolvedValue({ ...report, profitAndLossTotal: -50 });
      renderApp({ route: '/resultado' });
      setDates('2026-11-01', '2026-11-22');
      await user.click(screen.getByRole('button', { name: 'Gerar relatório' }));

      await screen.findByTestId('result-total');
      expect(screen.getByTestId('result-total')).toHaveClass('text-stop');
    });

    it('shows the empty copy when there are no days', async () => {
      const user = userEvent.setup();

      mocks.generateProfitAndLossReport.mockResolvedValue({ ...report, days: [] });
      renderApp({ route: '/resultado' });
      setDates('2026-11-01', '2026-11-22');
      await user.click(screen.getByRole('button', { name: 'Gerar relatório' }));

      expect(await screen.findByText('Nenhuma venda ou perda registrada nesse período.')).toBeInTheDocument();
    });

    it('rejects a start date after the end date', async () => {
      const user = userEvent.setup();

      renderApp({ route: '/resultado' });
      setDates('2026-11-22', '2026-11-01');
      await user.click(screen.getByRole('button', { name: 'Gerar relatório' }));

      expect(await screen.findByText('A data inicial não pode ser depois da final.')).toBeInTheDocument();
      expect(mocks.generateProfitAndLossReport).not.toHaveBeenCalled();
    });

    it('formats the heading in English', async () => {
      const user = userEvent.setup();

      mocks.generateProfitAndLossReport.mockResolvedValue(report);
      renderApp({ route: '/resultado', locale: 'en' });
      setDates('2026-11-01', '2026-11-22', ['From', 'To']);
      await user.click(screen.getByRole('button', { name: 'Generate report' }));

      expect(await screen.findByRole('heading', { name: 'Results from 11/01/2026 to 11/22/2026' })).toBeInTheDocument();
    });
  });
});
