import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { checkoutWorkspaceStorageKey } from '../features/checkout/lib/workspace';
import { App } from '../App';

const tenantId = '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1';
const saleId = 'd02f33a7-f2af-4623-a218-d1ed9dc11fd1';
const sessionId = '1c7281cc-c5ee-474a-884d-42d9b9be8293';
const serviceOptions = { baseUrl: 'http://localhost:3001' };

const {
  openCheckoutPosSessionMock,
  processCheckoutSalePaymentMock,
  completeCheckoutSaleMock,
  cancelCheckoutSaleMock,
  closeCheckoutPosSessionMock
} = vi.hoisted(() => ({
  openCheckoutPosSessionMock: vi.fn(),
  processCheckoutSalePaymentMock: vi.fn(),
  completeCheckoutSaleMock: vi.fn(),
  cancelCheckoutSaleMock: vi.fn(),
  closeCheckoutPosSessionMock: vi.fn()
}));

vi.mock('@supermarket/api-sdk', async () => {
  const actual = await vi.importActual<typeof import('@supermarket/api-sdk')>('@supermarket/api-sdk');

  return {
    ...actual,
    fetchServiceHealth: vi.fn().mockResolvedValue({
      serviceName: 'checkout-service',
      status: 'ok',
      timestamp: '2026-06-13T00:00:00.000Z'
    }),
    openCheckoutPosSession: openCheckoutPosSessionMock,
    startCheckoutSale: vi.fn(),
    scanCheckoutCatalogItemByBarcode: vi.fn(),
    addCheckoutSaleItem: vi.fn(),
    removeCheckoutSaleItem: vi.fn(),
    processCheckoutSalePayment: processCheckoutSalePaymentMock,
    completeCheckoutSale: completeCheckoutSaleMock,
    cancelCheckoutSale: cancelCheckoutSaleMock,
    closeCheckoutPosSession: closeCheckoutPosSessionMock
  };
});

describe('Checkout application shell', () => {
  beforeEach(() => {
    openCheckoutPosSessionMock.mockReset();
    processCheckoutSalePaymentMock.mockReset();
    completeCheckoutSaleMock.mockReset();
    cancelCheckoutSaleMock.mockReset();
    closeCheckoutPosSessionMock.mockReset();
    window.localStorage.clear();

    openCheckoutPosSessionMock.mockResolvedValue(createOpenSessionResponse());
    processCheckoutSalePaymentMock.mockResolvedValue(createPaidSaleResponse());
    completeCheckoutSaleMock.mockResolvedValue(createCompletedSaleResponse());
    cancelCheckoutSaleMock.mockImplementation(
      (input: { reason: string }) => Promise.resolve(createCanceledSaleResponse(input.reason))
    );
    closeCheckoutPosSessionMock.mockResolvedValue(createClosedSessionResponse());
  });

  it('renders the checkout headline', async () => {
    render(<App />);

    screen.getByText(/Checkout execution now reaches terminal flows/i);
    await screen.findByText(/Healthy/i);
  });

  it('opens a cashier session through the live form surface', async () => {
    render(<App />);

    const openSessionButton = screen.getAllByRole('button', { name: /Open session/i })[0];

    if (openSessionButton === undefined) {
      throw new Error('Expected open session button was not rendered');
    }

    fireEvent.click(openSessionButton);

    await waitFor(() => {
      expect(openCheckoutPosSessionMock).toHaveBeenCalledWith(
        {
          tenantId: '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1',
          registerId: 'register-01',
          operatorId: '2b6b69a3-1c2e-442e-928a-8f0614aa7d0e',
          openingFloatAmount: 150
        },
        {
          baseUrl: 'http://localhost:3001'
        }
      );
    });

    await screen.findByText(/Session opened/i);
    screen.getByText(/Register register-01 is now open for operator 2b6b69a3/i);
  });

  it('processes payment and completes a restored active sale', async () => {
    window.localStorage.setItem(
      checkoutWorkspaceStorageKey,
      JSON.stringify({
        tenantId: '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1',
        activeSession: createOpenSessionResponse(),
        activeSale: createOpenSaleResponse()
      })
    );

    render(<App />);

    const paidAmountInput = screen.getAllByLabelText(/Paid amount/i)[0];
    const processPaymentButton = screen.getAllByRole('button', { name: /Process payment/i })[0];
    const completeSaleButton = screen.getAllByRole('button', { name: /Complete sale/i })[0];

    if (
      paidAmountInput === undefined ||
      processPaymentButton === undefined ||
      completeSaleButton === undefined
    ) {
      throw new Error('Expected terminal flow controls were not rendered');
    }

    fireEvent.change(paidAmountInput, {
      target: { value: '22.90' }
    });
    fireEvent.click(processPaymentButton);

    await waitFor(() => {
      expect(processCheckoutSalePaymentMock).toHaveBeenCalledWith(
        {
          tenantId: '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1',
          saleId: 'd02f33a7-f2af-4623-a218-d1ed9dc11fd1',
          paymentMethod: 'CASH',
          paidAmount: 22.9
        },
        {
          baseUrl: 'http://localhost:3001'
        }
      );
    });

    await screen.findByText(/Payment captured/i);
    fireEvent.click(completeSaleButton);

    await waitFor(() => {
      expect(completeCheckoutSaleMock).toHaveBeenCalledWith(
        {
          tenantId: '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1',
          saleId: 'd02f33a7-f2af-4623-a218-d1ed9dc11fd1'
        },
        {
          baseUrl: 'http://localhost:3001'
        }
      );
    });

    await screen.findAllByText(/Sale completed/i);
    screen.getByText(/Receipt summary/i);
    screen.getByText(/Completion event published\./i);
  });

  it('cancels an open sale without a manager approval code', async () => {
    seedWorkspace({ activeSale: createOpenSaleResponse() });
    render(<App />);

    screen.getByText(/Provisional: not validated until manager credentials exist/i);
    expect(screen.getByLabelText(/Manager approval code/i)).toHaveProperty('value', '');

    fireEvent.change(screen.getByLabelText(/Cancellation reason/i), {
      target: { value: 'Customer requested reversal' }
    });
    fireEvent.click(screen.getByRole('button', { name: /^Cancel sale$/i }));

    await waitFor(() => {
      expect(cancelCheckoutSaleMock).toHaveBeenCalledTimes(1);
    });
    const [payload, options] = cancelCheckoutSaleMock.mock.calls[0] ?? [];
    expect(payload).toEqual({ tenantId, saleId, reason: 'Customer requested reversal' });
    expect(payload).not.toHaveProperty('managerApprovalCode');
    expect(options).toEqual(serviceOptions);

    await screen.findAllByText(/Sale canceled/i);
    screen.getByText(/Cancellation summary/i);
  });

  it('requires a manager approval code to cancel a paid sale and forwards it as typed', async () => {
    seedWorkspace({ activeSale: createPaidSaleResponse() });
    render(<App />);

    fireEvent.change(screen.getByLabelText(/Cancellation reason/i), {
      target: { value: 'Wrong payment method' }
    });
    fireEvent.click(screen.getByRole('button', { name: /^Cancel sale$/i }));

    await screen.findByText('Manager approval code is required after payment or completion.');
    expect(cancelCheckoutSaleMock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Manager approval code/i), {
      target: { value: '  MANAGER-01  ' }
    });
    fireEvent.click(screen.getByRole('button', { name: /^Cancel sale$/i }));

    await waitFor(() => {
      expect(cancelCheckoutSaleMock).toHaveBeenCalledWith(
        { tenantId, saleId, reason: 'Wrong payment method', managerApprovalCode: 'MANAGER-01' },
        serviceOptions
      );
    });
    await screen.findAllByText(/Sale canceled/i);
  });

  it('blocks register closure while a paid sale is still pending completion', () => {
    seedWorkspace({ activeSale: createPaidSaleResponse() });
    render(<App />);

    screen.getByText(/Register closure is blocked/i);
    expect(screen.getByRole('button', { name: /^Close session$/i })).toHaveProperty(
      'disabled',
      true
    );
  });

  it('closes the register with the declared cash amount', async () => {
    seedWorkspace({ activeSale: createCompletedSaleResponse() });
    render(<App />);

    fireEvent.change(screen.getByLabelText(/Declared cash amount/i), {
      target: { value: '150.00' }
    });
    fireEvent.click(screen.getByRole('button', { name: /^Close session$/i }));

    await waitFor(() => {
      expect(closeCheckoutPosSessionMock).toHaveBeenCalledWith(
        { tenantId, sessionId, declaredCashAmount: 150 },
        serviceOptions
      );
    });
    await screen.findAllByText(/Session closed/i);
    screen.getByText(/Session closure summary/i);
  });

  it('shows the backend message when the payment is rejected', async () => {
    const { ApiClientError } =
      await vi.importActual<typeof import('@supermarket/api-sdk')>('@supermarket/api-sdk');
    const message = `Paid amount 10 is insufficient for cash payment on sale ${saleId}`;
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
    render(<App />);

    fireEvent.change(screen.getAllByLabelText(/Paid amount/i)[0] as HTMLElement, {
      target: { value: '10' }
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Process payment/i })[0] as HTMLElement);

    await screen.findByText(/Payment failed/i);
    screen.getByText(message);
  });

  it('disables cancellation once the session is closed', () => {
    seedWorkspace({
      activeSession: createClosedSessionResponse(),
      activeSale: createCompletedSaleResponse()
    });
    render(<App />);

    expect(screen.getByRole('button', { name: /^Cancel sale$/i })).toHaveProperty(
      'disabled',
      true
    );
  });
});

function seedWorkspace(overrides: { activeSession?: unknown; activeSale: unknown }) {
  window.localStorage.setItem(
    checkoutWorkspaceStorageKey,
    JSON.stringify({
      tenantId,
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
