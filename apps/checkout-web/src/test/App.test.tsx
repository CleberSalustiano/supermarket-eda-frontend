import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { App } from '../App';

const { openCheckoutPosSessionMock } = vi.hoisted(() => ({
  openCheckoutPosSessionMock: vi.fn()
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
    removeCheckoutSaleItem: vi.fn()
  };
});

describe('Checkout application shell', () => {
  beforeEach(() => {
    openCheckoutPosSessionMock.mockReset();
    window.localStorage.clear();
    openCheckoutPosSessionMock.mockResolvedValue({
      sessionId: '1c7281cc-c5ee-474a-884d-42d9b9be8293',
      tenantId: '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1',
      registerId: 'register-01',
      operatorId: 'cashier-01',
      openingFloatAmount: 150,
      declaredCashAmount: null,
      status: 'OPEN',
      openedAt: '2026-06-14T12:00:00.000Z',
      closedAt: null,
      createdAt: '2026-06-14T12:00:00.000Z',
      updatedAt: '2026-06-14T12:00:00.000Z'
    });
  });

  it('renders the checkout headline', async () => {
    render(<App />);

    screen.getByText(/Checkout execution is now operational/i);
    await screen.findByText(/Healthy/i);
  });

  it('opens a cashier session through the live form surface', async () => {
    render(<App />);

    const registerInput = screen.getAllByPlaceholderText('register-01')[0];
    const operatorInput = screen.getAllByPlaceholderText('cashier-01')[0];
    const openingFloatInput = screen.getAllByPlaceholderText('150.00')[0];
    const openSessionButton = screen.getAllByRole('button', { name: /Open session/i })[0];

    if (
      registerInput === undefined ||
      operatorInput === undefined ||
      openingFloatInput === undefined ||
      openSessionButton === undefined
    ) {
      throw new Error('Expected checkout session form controls were not rendered');
    }

    fireEvent.change(registerInput, {
      target: { value: 'register-01' }
    });
    fireEvent.change(operatorInput, {
      target: { value: 'cashier-01' }
    });
    fireEvent.change(openingFloatInput, {
      target: { value: '150.00' }
    });

    fireEvent.click(openSessionButton);

    await waitFor(() => {
      expect(openCheckoutPosSessionMock).toHaveBeenCalledWith(
        {
          tenantId: '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1',
          registerId: 'register-01',
          operatorId: 'cashier-01',
          openingFloatAmount: 150
        },
        {
          baseUrl: 'http://localhost:3001'
        }
      );
    });

    await screen.findByText(/Session opened/i);
    screen.getByText(/Register register-01 is now open for operator cashier-01/i);
  });
});
