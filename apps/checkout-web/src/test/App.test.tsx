import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { checkoutWorkspaceStorageKey } from '../features/checkout/lib/workspace';
import { App } from '../App';
import { renderApp } from './render-app';

const tenantId = '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1';
const operatorId = '2b6b69a3-1c2e-442e-928a-8f0614aa7d0e';
const saleId = 'd02f33a7-f2af-4623-a218-d1ed9dc11fd1';
const sessionId = '1c7281cc-c5ee-474a-884d-42d9b9be8293';
const barcode = '7891234567890';
const serviceOptions = { baseUrl: 'http://localhost:3001' };

const mocks = vi.hoisted(() => ({
  fetchServiceHealth: vi.fn(),
  openCheckoutPosSession: vi.fn(),
  startCheckoutSale: vi.fn(),
  scanCheckoutCatalogItemByBarcode: vi.fn(),
  addCheckoutSaleItem: vi.fn(),
  removeCheckoutSaleItem: vi.fn(),
  processCheckoutSalePayment: vi.fn(),
  completeCheckoutSale: vi.fn(),
  cancelCheckoutSale: vi.fn(),
  closeCheckoutPosSession: vi.fn()
}));

vi.mock('@supermarket/api-sdk', async () => {
  const actual = await vi.importActual<typeof import('@supermarket/api-sdk')>('@supermarket/api-sdk');

  return { ...actual, ...mocks };
});

const {
  openCheckoutPosSession: openCheckoutPosSessionMock,
  startCheckoutSale: startCheckoutSaleMock,
  scanCheckoutCatalogItemByBarcode: scanMock,
  addCheckoutSaleItem: addMock,
  removeCheckoutSaleItem: removeMock,
  processCheckoutSalePayment: processCheckoutSalePaymentMock,
  completeCheckoutSale: completeCheckoutSaleMock,
  cancelCheckoutSale: cancelCheckoutSaleMock,
  closeCheckoutPosSession: closeCheckoutPosSessionMock
} = mocks;

describe('Checkout application', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset();
    }
    window.localStorage.clear();

    mocks.fetchServiceHealth.mockResolvedValue({
      serviceName: 'checkout-service',
      status: 'ok',
      timestamp: '2026-06-13T00:00:00.000Z'
    });
    openCheckoutPosSessionMock.mockResolvedValue(createOpenSessionResponse());
    startCheckoutSaleMock.mockResolvedValue({ ...createOpenSaleResponse(), items: [], totalItemsQuantity: 0, subtotal: 0, total: 0 });
    addMock.mockResolvedValue(createOpenSaleResponse());
    removeMock.mockResolvedValue({ ...createOpenSaleResponse(), items: [], totalItemsQuantity: 0, subtotal: 0, total: 0 });
    scanMock.mockResolvedValue(createCatalogItem());
    processCheckoutSalePaymentMock.mockResolvedValue(createPaidSaleResponse());
    completeCheckoutSaleMock.mockResolvedValue(createCompletedSaleResponse());
    cancelCheckoutSaleMock.mockImplementation(
      (input: { reason: string }) => Promise.resolve(createCanceledSaleResponse(input.reason))
    );
    closeCheckoutPosSessionMock.mockResolvedValue(createClosedSessionResponse());
  });

  describe('register opening and scanning', () => {
    it('shows the register opening form without a session and opens it', async () => {
      renderApp();

      screen.getByRole('heading', { name: 'Abrir caixa' });
      expect(screen.getByLabelText('ID do operador')).toHaveProperty('value', operatorId);
      screen.getByText('Copie o ID na gestão, em Funcionários.');
      expect(screen.getByLabelText('Fundo de troco')).toHaveProperty('value', '150,00');

      fireEvent.click(screen.getByRole('button', { name: 'Abrir caixa' }));

      await waitFor(() => {
        expect(openCheckoutPosSessionMock).toHaveBeenCalledWith(
          { tenantId, registerId: 'register-01', operatorId, openingFloatAmount: 150 },
          serviceOptions
        );
      });
      await screen.findByLabelText('Código de barras');
    });

    it('rejects an operator id that is not a UUID', async () => {
      renderApp();

      fireEvent.change(screen.getByLabelText('ID do operador'), { target: { value: 'abc' } });
      fireEvent.click(screen.getByRole('button', { name: 'Abrir caixa' }));

      await screen.findByText('O ID do operador precisa ser um UUID válido.');
      expect(openCheckoutPosSessionMock).not.toHaveBeenCalled();
    });

    it('starts a sale with F2', async () => {
      seedWorkspace({ activeSale: null });
      renderApp();

      fireEvent.keyDown(window, { key: 'F2' });

      await waitFor(() => {
        expect(startCheckoutSaleMock).toHaveBeenCalledWith({ tenantId, sessionId }, serviceOptions);
      });
    });

    it('adds items from the scanner, supports quantity*code and keeps the focus there', async () => {
      seedWorkspace({ activeSale: createEmptySale() });
      renderApp();
      const scanner = screen.getByLabelText('Código de barras');

      fireEvent.change(scanner, { target: { value: barcode } });
      fireEvent.submit(scanner.closest('form') as HTMLFormElement);

      await waitFor(() => {
        expect(addMock).toHaveBeenCalledWith(
          { tenantId, saleId, barcode, quantity: 1 },
          serviceOptions
        );
      });
      await waitFor(() => {
        expect(document.activeElement).toBe(scanner);
      });
      expect(scanner).toHaveProperty('value', '');

      fireEvent.change(scanner, { target: { value: `3*${barcode}` } });
      fireEvent.submit(scanner.closest('form') as HTMLFormElement);

      await waitFor(() => {
        expect(addMock).toHaveBeenLastCalledWith(
          { tenantId, saleId, barcode, quantity: 3 },
          serviceOptions
        );
      });
    });

    it('shows the format error for an invalid quantity', () => {
      seedWorkspace({ activeSale: createEmptySale() });
      renderApp();
      const scanner = screen.getByLabelText('Código de barras');

      fireEvent.change(scanner, { target: { value: `0*${barcode}` } });
      fireEvent.submit(scanner.closest('form') as HTMLFormElement);

      screen.getByText('Use o formato quantidade*código, por exemplo 3*7891234567890.');
      expect(addMock).not.toHaveBeenCalled();
    });

    it('checks a price without adding the item', async () => {
      seedWorkspace({ activeSale: createEmptySale() });
      renderApp();

      fireEvent.change(screen.getByLabelText('Código de barras'), { target: { value: barcode } });
      fireEvent.click(screen.getByRole('button', { name: 'Consultar preço' }));

      await waitFor(() => {
        expect(scanMock).toHaveBeenCalledWith({ tenantId, barcode }, serviceOptions);
      });
      await screen.findByRole('img', { name: /Arabica coffee beans 1kg: R\$\s22,90/ });
      expect(addMock).not.toHaveBeenCalled();
    });

    it('explains an unknown product when the lookup returns 404', async () => {
      const { ApiClientError } =
        await vi.importActual<typeof import('@supermarket/api-sdk')>('@supermarket/api-sdk');
      scanMock.mockRejectedValue(new ApiClientError('Not found', 404, null));
      seedWorkspace({ activeSale: createEmptySale() });
      renderApp();

      fireEvent.change(screen.getByLabelText('Código de barras'), { target: { value: barcode } });
      fireEvent.click(screen.getByRole('button', { name: 'Consultar preço' }));

      await screen.findByText(
        `Produto não encontrado: ${barcode}. Confira o código ou cadastre o produto na gestão.`
      );
    });

    it('removes one unit from a line item', async () => {
      seedWorkspace({ activeSale: createOpenSaleResponse() });
      renderApp();

      fireEvent.click(
        screen.getByRole('button', { name: 'Remover 1 unidade de Arabica coffee beans 1kg' })
      );

      await waitFor(() => {
        expect(removeMock).toHaveBeenCalledWith(
          { tenantId, saleId, barcode, quantity: 1 },
          serviceOptions
        );
      });
    });

    it('shows the sale total as a price tag', () => {
      seedWorkspace({ activeSale: createOpenSaleResponse() });
      renderApp();

      screen.getByRole('img', { name: /Total da venda: R\$\s22,90/ });
      screen.getByText('1 item');
    });
  });

  describe('connection, configuration and language', () => {
    it('hides the connection banner when healthy and shows it when the health check fails', async () => {
      const healthy = renderApp();
      await waitFor(() => {
        expect(mocks.fetchServiceHealth).toHaveBeenCalled();
      });
      expect(screen.queryByText(/Sem conexão com/)).toBeNull();
      healthy.unmount();

      mocks.fetchServiceHealth.mockRejectedValue(new Error('down'));
      renderApp();
      await screen.findByText(/Sem conexão com o servidor do caixa/);
      screen.getByRole('button', { name: 'Tentar agora' });
    });

    it('has no showcase content', () => {
      renderApp();

      expect(screen.queryByText(/Tenant id|demo tenant|feature lanes|route inventory|Healthy/i)).toBeNull();
    });

    it('shows the configuration error screen when required config is missing', () => {
      render(<App configResult={{ ok: false, missing: ['FRONTEND_TENANT_ID'] }} />);

      screen.getByRole('heading', { name: 'Configuração incompleta' });
      screen.getByText('FRONTEND_TENANT_ID');
    });

    it('switches to English through Preferences and formats amounts accordingly', async () => {
      seedWorkspace({
        activeSession: createClosedSessionResponse(),
        activeSale: null
      });
      renderApp();
      screen.getByRole('heading', { name: 'Abrir caixa' });

      fireEvent.click(screen.getByRole('button', { name: 'Preferências' }));
      fireEvent.click(screen.getByRole('radio', { name: 'English' }));

      await screen.findByRole('heading', { name: 'Open register' });
      screen.getByText(/Declared cash R\$150\.00/);
      expect(document.documentElement.lang).toBe('en');
    });
  });

  describe('payment, completion and receipt', () => {
    it('takes a cash payment and completes the sale with the exact payloads', async () => {
      seedWorkspace({ activeSale: createOpenSaleResponse() });
      renderApp();

      fireEvent.change(screen.getByLabelText('Valor recebido'), { target: { value: '22,90' } });
      fireEvent.click(screen.getByRole('button', { name: /Receber pagamento/ }));

      await waitFor(() => {
        expect(processCheckoutSalePaymentMock).toHaveBeenCalledWith(
          { tenantId, saleId, paymentMethod: 'CASH', paidAmount: 22.9 },
          serviceOptions
        );
      });

      await screen.findByRole('heading', { name: 'Pagamento recebido' });
      fireEvent.click(screen.getByRole('button', { name: /Concluir venda/ }));

      await waitFor(() => {
        expect(completeCheckoutSaleMock).toHaveBeenCalledWith({ tenantId, saleId }, serviceOptions);
      });
      await screen.findByText(/Venda concluída às/);
      screen.getByText('Venda d02f33a7');
      expect(screen.queryByText(/sincronização com a gestão/)).toBeNull();
    });

    it('fills the exact total read-only for non-cash methods', () => {
      seedWorkspace({ activeSale: createOpenSaleResponse() });
      renderApp();
      const amount = screen.getByLabelText('Valor recebido');

      fireEvent.click(screen.getByRole('radio', { name: 'Pix' }));

      expect(amount).toHaveProperty('value', '22,90');
      expect(amount).toHaveProperty('readOnly', true);
      expect(screen.queryByRole('button', { name: 'Valor exato' })).toBeNull();

      fireEvent.click(screen.getByRole('radio', { name: 'Dinheiro' }));

      expect(amount).toHaveProperty('value', '');
      expect(amount).toHaveProperty('readOnly', false);
    });

    it('shows the change live and disables the payment while cash falls short', () => {
      seedWorkspace({ activeSale: createOpenSaleResponse() });
      renderApp();
      const submit = screen.getByRole('button', { name: /Receber pagamento/ });

      fireEvent.change(screen.getByLabelText('Valor recebido'), { target: { value: '10' } });

      screen.getByText('Faltam R$ 12,90');
      expect(submit).toHaveProperty('disabled', true);

      fireEvent.change(screen.getByLabelText('Valor recebido'), { target: { value: '50' } });

      expect(screen.queryByText(/Faltam/)).toBeNull();
      expect(submit).toHaveProperty('disabled', false);
      screen.getByText('R$ 27,10');
    });

    it('uses "Valor exato" to fill the total', () => {
      seedWorkspace({ activeSale: createOpenSaleResponse() });
      renderApp();

      fireEvent.click(screen.getByRole('button', { name: 'Valor exato' }));

      expect(screen.getByLabelText('Valor recebido')).toHaveProperty('value', '22,90');
    });

    it('F8 focuses an empty amount and then submits the payment', async () => {
      seedWorkspace({ activeSale: createOpenSaleResponse() });
      renderApp();
      const amount = screen.getByLabelText('Valor recebido');

      fireEvent.keyDown(window, { key: 'F8' });

      expect(document.activeElement).toBe(amount);
      expect(processCheckoutSalePaymentMock).not.toHaveBeenCalled();

      fireEvent.change(amount, { target: { value: '22,90' } });
      fireEvent.keyDown(window, { key: 'F8' });

      await waitFor(() => {
        expect(processCheckoutSalePaymentMock).toHaveBeenCalledWith(
          { tenantId, saleId, paymentMethod: 'CASH', paidAmount: 22.9 },
          serviceOptions
        );
      });
    });

    it('F9 completes a paid sale', async () => {
      seedWorkspace({ activeSale: createPaidSaleResponse() });
      renderApp();

      screen.getByRole('heading', { name: 'Pagamento recebido' });
      fireEvent.keyDown(window, { key: 'F9' });

      await waitFor(() => {
        expect(completeCheckoutSaleMock).toHaveBeenCalledWith({ tenantId, saleId }, serviceOptions);
      });
    });

    it('warns when the completed sale has a pending sync', async () => {
      completeCheckoutSaleMock.mockResolvedValue({
        ...createCompletedSaleResponse(),
        eventPublicationStatus: 'pending'
      });
      seedWorkspace({ activeSale: createPaidSaleResponse() });
      renderApp();

      fireEvent.click(screen.getByRole('button', { name: /Concluir venda/ }));

      await screen.findByText(/A sincronização com a gestão está pendente/);
    });

    it('recovers the receipt of a completed sale after a reload', () => {
      seedWorkspace({ activeSale: createCompletedSaleResponse() });
      renderApp();

      screen.getByText(/Venda concluída às/);
      screen.getByRole('button', { name: /Nova venda/ });
    });

    it('shows the receipt in English with en formatting', async () => {
      seedWorkspace({ activeSale: createCompletedSaleResponse() });
      renderApp({ locale: 'en' });

      screen.getByText(/Sale completed at/);
      expect(screen.getAllByText('R$22.90').length).toBeGreaterThan(0);
      screen.getByRole('button', { name: /New sale/ });
    });

    it('shows the backend message and support code when the payment is rejected', async () => {
      const { ApiClientError } =
        await vi.importActual<typeof import('@supermarket/api-sdk')>('@supermarket/api-sdk');
      const message = `Paid amount 22.9 is not accepted for sale ${saleId}`;
      processCheckoutSalePaymentMock.mockRejectedValue(
        new ApiClientError(message, 409, {
          statusCode: 409,
          message,
          path: `/sales/${saleId}/payment`,
          correlationId: 'corr-123',
          timestamp: '2026-06-14T12:02:00.000Z'
        })
      );
      seedWorkspace({ activeSale: createOpenSaleResponse() });
      renderApp();

      fireEvent.change(screen.getByLabelText('Valor recebido'), { target: { value: '22,90' } });
      fireEvent.click(screen.getByRole('button', { name: /Receber pagamento/ }));

      await screen.findByText('Pagamento não aceito.');
      screen.getByText(`Detalhe do servidor: ${message}`);
      screen.getByText('Código para suporte: corr-123');
    });
  });

  describe('cancellation', () => {
    it('cancels an open sale without a manager approval', async () => {
      seedWorkspace({ activeSale: createOpenSaleResponse() });
      renderApp();

      fireEvent.click(screen.getByRole('button', { name: /Cancelar venda/ }));
      const dialog = screen.getByRole('dialog', { name: 'Cancelar venda' });
      expect(within(dialog).queryByLabelText('Código do gerente')).toBeNull();
      expect(within(dialog).queryByLabelText('PIN do gerente')).toBeNull();

      fireEvent.change(within(dialog).getByLabelText('Motivo do cancelamento'), {
        target: { value: 'Customer requested reversal' }
      });
      fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar cancelamento' }));

      await waitFor(() => {
        expect(cancelCheckoutSaleMock).toHaveBeenCalledTimes(1);
      });
      const [payload, options] = cancelCheckoutSaleMock.mock.calls[0] ?? [];
      expect(payload).toEqual({ tenantId, saleId, reason: 'Customer requested reversal' });
      expect(payload).not.toHaveProperty('managerApproval');
      expect(options).toEqual(serviceOptions);

      await screen.findByText('Venda cancelada. Motivo: Customer requested reversal.');
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    describe('paid sale with manager approval', () => {
      const managerPin = '2468';

      async function openPaidCancelDialog() {
        seedWorkspace({ activeSale: createPaidSaleResponse() });
        renderApp();
        fireEvent.keyDown(window, { key: 'F4' });
        const dialog = screen.getByRole('dialog', { name: 'Cancelar venda' });
        fireEvent.change(within(dialog).getByLabelText('Motivo do cancelamento'), {
          target: { value: 'Wrong payment method' }
        });
        return dialog;
      }

      function submit(dialog: HTMLElement) {
        fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar cancelamento' }));
      }

      async function rejectWith(status: number) {
        const { ApiClientError } =
          await vi.importActual<typeof import('@supermarket/api-sdk')>('@supermarket/api-sdk');
        const message = 'Manager approval backend detail';
        cancelCheckoutSaleMock.mockRejectedValueOnce(
          new ApiClientError(message, status, {
            statusCode: status,
            message,
            path: `/sales/${saleId}/cancellation`,
            correlationId: 'corr-approval',
            timestamp: '2026-06-14T12:05:00.000Z'
          })
        );
      }

      it('shows the manager code and a masked numeric PIN field with the manager hint', async () => {
        const dialog = await openPaidCancelDialog();

        within(dialog).getByText('Vendas pagas ou concluídas precisam do código e do PIN de um gerente.');
        const code = within(dialog).getByLabelText('Código do gerente');
        const pin = within(dialog).getByLabelText('PIN do gerente');
        expect(code).toHaveProperty('maxLength', 32);
        expect(pin).toHaveProperty('type', 'password');
        expect(pin).toHaveProperty('maxLength', 12);
        expect(pin.getAttribute('inputmode')).toBe('numeric');
      });

      it('validates the manager code and PIN without sending a request', async () => {
        const dialog = await openPaidCancelDialog();

        submit(dialog);
        await screen.findByText('Informe o código do gerente.');
        screen.getByText('O PIN tem de 4 a 12 dígitos.');

        fireEvent.change(within(dialog).getByLabelText('Código do gerente'), { target: { value: 'MANAGER-01' } });
        fireEvent.change(within(dialog).getByLabelText('PIN do gerente'), { target: { value: '123' } });
        submit(dialog);
        await screen.findByText('O PIN tem de 4 a 12 dígitos.');
        expect(cancelCheckoutSaleMock).not.toHaveBeenCalled();
      });

      it('sends the upper-cased code and the PIN, then shows who approved', async () => {
        cancelCheckoutSaleMock.mockResolvedValueOnce({
          ...createCanceledSaleResponse('Wrong payment method'),
          cancellationApprovedBy: {
            employeeId: '5a1d1c68-3a0c-4f0e-9f84-0f0f7d9a2b11',
            employeeCode: 'MANAGER-01',
            fullName: 'Bruno Lima'
          }
        });
        const dialog = await openPaidCancelDialog();

        fireEvent.change(within(dialog).getByLabelText('Código do gerente'), {
          target: { value: '  manager-01 ' }
        });
        fireEvent.change(within(dialog).getByLabelText('PIN do gerente'), { target: { value: managerPin } });
        submit(dialog);

        await waitFor(() => {
          expect(cancelCheckoutSaleMock).toHaveBeenCalledWith(
            {
              tenantId,
              saleId,
              reason: 'Wrong payment method',
              managerApproval: { employeeCode: 'MANAGER-01', pin: managerPin }
            },
            serviceOptions
          );
        });
        await screen.findByText('Aprovado por Bruno Lima (MANAGER-01).');
        screen.getByText(/Venda cancelada\. Motivo: Wrong payment method/);
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(JSON.stringify({ ...window.localStorage })).not.toContain(managerPin);
      });

      it.each([
        [403, 'Código do gerente ou PIN inválido.'],
        [429, 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'],
        [503, 'Gestão indisponível, tente novamente. A venda não foi cancelada.']
      ])('on %i keeps the dialog open, clears and focuses only the PIN', async (status, message) => {
        await rejectWith(status);
        const dialog = await openPaidCancelDialog();
        const code = within(dialog).getByLabelText('Código do gerente');
        const pin = within(dialog).getByLabelText('PIN do gerente');

        fireEvent.change(code, { target: { value: 'MANAGER-01' } });
        fireEvent.change(pin, { target: { value: managerPin } });
        submit(dialog);

        await within(dialog).findByText(message);
        within(dialog).getByText('Código para suporte: corr-approval');
        expect(within(dialog).queryByText(/Manager approval backend detail/)).toBeNull();
        await waitFor(() => {
          expect(document.activeElement).toBe(pin);
        });
        expect(pin).toHaveProperty('value', '');
        expect(code).toHaveProperty('value', 'MANAGER-01');
        expect(within(dialog).getByLabelText('Motivo do cancelamento')).toHaveProperty(
          'value',
          'Wrong payment method'
        );
        expect(screen.getByRole('dialog', { name: 'Cancelar venda' })).toBeTruthy();
        expect(JSON.stringify({ ...window.localStorage })).not.toContain(managerPin);
        const stored = window.localStorage.getItem(checkoutWorkspaceStorageKey) ?? '';
        expect(stored).toContain('"status":"PAID"');
      });

      it('shows the unavailable message in English', async () => {
        await rejectWith(503);
        seedWorkspace({ activeSale: createPaidSaleResponse() });
        renderApp({ locale: 'en' });
        fireEvent.keyDown(window, { key: 'F4' });
        const dialog = screen.getByRole('dialog', { name: 'Cancel sale' });
        fireEvent.change(within(dialog).getByLabelText('Cancellation reason'), {
          target: { value: 'Wrong payment method' }
        });
        fireEvent.change(within(dialog).getByLabelText('Manager code'), { target: { value: 'MANAGER-01' } });
        fireEvent.change(within(dialog).getByLabelText('Manager PIN'), { target: { value: managerPin } });
        fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm cancellation' }));

        await within(dialog).findByText('Management is unavailable, try again. The sale was not canceled.');
      });
    });

    it('closes the dialog with Esc and returns the focus to the scanner', async () => {
      seedWorkspace({ activeSale: createEmptySale() });
      renderApp();
      const scanner = screen.getByLabelText('Código de barras');

      fireEvent.keyDown(window, { key: 'F4' });
      const dialog = screen.getByRole('dialog', { name: 'Cancelar venda' });
      within(dialog).getByLabelText('Motivo do cancelamento').focus();

      fireEvent.keyDown(within(dialog).getByLabelText('Motivo do cancelamento'), { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull();
      });
      expect(document.activeElement).toBe(scanner);
      expect(cancelCheckoutSaleMock).not.toHaveBeenCalled();
    });

    it('offers no cancellation once the session is closed', () => {
      seedWorkspace({
        activeSession: createClosedSessionResponse(),
        activeSale: createCompletedSaleResponse()
      });
      renderApp();

      screen.getByRole('heading', { name: 'Abrir caixa' });
      expect(screen.queryByRole('button', { name: /Cancelar venda/ })).toBeNull();
    });
  });

  describe('closing the register', () => {
    it('blocks the closure while a paid sale is still pending completion', () => {
      seedWorkspace({ activeSale: createPaidSaleResponse() });
      renderApp();

      fireEvent.click(screen.getByRole('button', { name: 'Fechar caixa' }));
      const dialog = screen.getByRole('dialog', { name: 'Fechar caixa' });

      within(dialog).getByText('Conclua ou cancele a venda em andamento antes de fechar o caixa.');
      expect(within(dialog).getByRole('button', { name: 'Fechar caixa' })).toHaveProperty('disabled', true);
    });

    it('closes the register with the declared cash and returns to the opening screen', async () => {
      seedWorkspace({ activeSale: createCompletedSaleResponse() });
      renderApp();

      fireEvent.click(screen.getByRole('button', { name: 'Fechar caixa' }));
      const dialog = screen.getByRole('dialog', { name: 'Fechar caixa' });
      expect(within(dialog).getByLabelText('Dinheiro contado na gaveta')).toHaveProperty('value', '150,00');

      fireEvent.change(within(dialog).getByLabelText('Dinheiro contado na gaveta'), {
        target: { value: '172,90' }
      });
      fireEvent.click(within(dialog).getByRole('button', { name: 'Fechar caixa' }));

      await waitFor(() => {
        expect(closeCheckoutPosSessionMock).toHaveBeenCalledWith(
          { tenantId, sessionId, declaredCashAmount: 172.9 },
          serviceOptions
        );
      });
      await screen.findByText(/Caixa register-01 fechado às .* Dinheiro declarado R\$\s150,00\./);
      screen.getByRole('heading', { name: 'Abrir caixa' });
    });
  });

  describe('below 640px', () => {
    const originalMatchMedia = window.matchMedia;

    beforeEach(() => {
      stubCompactViewport();
    });

    afterEach(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: originalMatchMedia
      });
    });

    it('repeats the primary step in a bottom bar and moves the actions into a menu', async () => {
      seedWorkspace({ activeSale: createOpenSaleResponse() });
      renderApp();

      expect(screen.queryByText(/Operador 2b6b69a3/)).toBeNull();
      screen.getByRole('img', { name: /Total da venda: R\$\s22,90/ });

      fireEvent.change(screen.getByLabelText('Valor recebido'), { target: { value: '22,90' } });
      const buttons = screen.getAllByRole('button', { name: /Receber pagamento/ });
      // Only the sticky bottom bar carries the primary action below 640px.
      expect(buttons).toHaveLength(1);
      expect(document.querySelector('#payment-form button[type="submit"]')).toBeNull();
      fireEvent.click(buttons[0] as HTMLElement);

      await waitFor(() => {
        expect(processCheckoutSalePaymentMock).toHaveBeenCalledTimes(1);
      });

      fireEvent.click(screen.getByRole('button', { name: 'Mais ações' }));
      fireEvent.click(screen.getByRole('button', { name: 'Fechar caixa' }));

      screen.getByRole('dialog', { name: 'Fechar caixa' });
    });

    it('shows "Nova venda" in the bar once the sale is settled', () => {
      seedWorkspace({ activeSale: createCompletedSaleResponse() });
      renderApp();

      expect(screen.getAllByRole('button', { name: /Nova venda/ })).toHaveLength(1);
    });

    it('keeps F8 working without the in-pane payment button', async () => {
      seedWorkspace({ activeSale: createOpenSaleResponse() });
      renderApp();

      fireEvent.change(screen.getByLabelText('Valor recebido'), { target: { value: '22,90' } });
      fireEvent.keyDown(window, { key: 'F8' });

      await waitFor(() => {
        expect(processCheckoutSalePaymentMock).toHaveBeenCalledTimes(1);
      });
    });
  });
});

function stubCompactViewport() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('max-width: 639px'),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
      onchange: null
    })
  });
}

function seedWorkspace(overrides: { activeSession?: unknown; activeSale: unknown }) {
  window.localStorage.setItem(
    checkoutWorkspaceStorageKey,
    JSON.stringify({
      activeSession: overrides.activeSession ?? createOpenSessionResponse(),
      activeSale: overrides.activeSale
    })
  );
}

function createCanceledSaleResponse(reason: string) {
  return {
    ...createOpenSaleResponse(),
    status: 'CANCELED' as const,
    canceledAt: '2026-06-14T12:05:00.000Z',
    cancellationReason: reason,
    cancellationApprovedBy: null,
    updatedAt: '2026-06-14T12:05:00.000Z',
    eventPublicationStatus: 'published' as const
  };
}

function createClosedSessionResponse() {
  return {
    ...createOpenSessionResponse(),
    status: 'CLOSED' as const,
    declaredCashAmount: 150,
    closedAt: '2026-06-14T18:00:00.000Z',
    updatedAt: '2026-06-14T18:00:00.000Z',
    eventPublicationStatus: 'published' as const
  };
}

function createOpenSessionResponse() {
  return {
    sessionId: '1c7281cc-c5ee-474a-884d-42d9b9be8293',
    tenantId: '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1',
    registerId: 'register-01',
    operatorId: '2b6b69a3-1c2e-442e-928a-8f0614aa7d0e',
    openingFloatAmount: 150,
    declaredCashAmount: null,
    status: 'OPEN' as const,
    openedAt: '2026-06-14T12:00:00.000Z',
    closedAt: null,
    createdAt: '2026-06-14T12:00:00.000Z',
    updatedAt: '2026-06-14T12:00:00.000Z'
  };
}

function createOpenSaleResponse() {
  return {
    saleId: 'd02f33a7-f2af-4623-a218-d1ed9dc11fd1',
    tenantId: '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1',
    sessionId: '1c7281cc-c5ee-474a-884d-42d9b9be8293',
    status: 'OPEN' as const,
    paymentMethod: null,
    paidAmount: null,
    changeAmount: null,
    paidAt: null,
    completedAt: null,
    canceledAt: null,
    cancellationReason: null,
    cancellationApprovedBy: null,
    totalItemsQuantity: 1,
    subtotal: 22.9,
    total: 22.9,
    items: [
      {
        productId: '1fdabff2-df1e-4b4d-86d7-0ca929e0a7b9',
        barcode: '7891234567890',
        name: 'Arabica coffee beans 1kg',
        unitOfMeasure: 'UN',
        unitPrice: 22.9,
        quantity: 1,
        lineTotal: 22.9
      }
    ],
    createdAt: '2026-06-14T12:01:00.000Z',
    updatedAt: '2026-06-14T12:01:00.000Z'
  };
}

function createPaidSaleResponse() {
  return {
    ...createOpenSaleResponse(),
    status: 'PAID' as const,
    paymentMethod: 'CASH' as const,
    paidAmount: 22.9,
    changeAmount: 0,
    paidAt: '2026-06-14T12:02:00.000Z',
    updatedAt: '2026-06-14T12:02:00.000Z'
  };
}

function createCompletedSaleResponse() {
  const paidSale = createPaidSaleResponse();

  return {
    ...paidSale,
    status: 'COMPLETED' as const,
    completedAt: '2026-06-14T12:03:00.000Z',
    updatedAt: '2026-06-14T12:03:00.000Z',
    eventPublicationStatus: 'published' as const,
    receipt: {
      saleId: paidSale.saleId,
      tenantId: paidSale.tenantId,
      sessionId: paidSale.sessionId,
      paymentMethod: 'CASH' as const,
      paidAmount: 22.9,
      changeAmount: 0,
      totalItemsQuantity: 1,
      total: 22.9,
      completedAt: '2026-06-14T12:03:00.000Z',
      issuedAt: '2026-06-14T12:03:00.000Z',
      items: paidSale.items
    }
  };
}

function createEmptySale() {
  return {
    ...createOpenSaleResponse(),
    totalItemsQuantity: 0,
    subtotal: 0,
    total: 0,
    items: []
  };
}

function createCatalogItem() {
  return {
    productId: '1fdabff2-df1e-4b4d-86d7-0ca929e0a7b9',
    tenantId,
    barcode,
    name: 'Arabica coffee beans 1kg',
    unitOfMeasure: 'UN',
    unitPrice: 22.9,
    active: true,
    priceUpdatedAt: '2026-06-14T11:00:00.000Z'
  };
}
