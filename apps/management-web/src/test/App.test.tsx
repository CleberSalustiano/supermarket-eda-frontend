import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { App } from '../App';

const { fetchServiceHealthMock, registerManagementProductMock } = vi.hoisted(() => ({
  fetchServiceHealthMock: vi.fn(),
  registerManagementProductMock: vi.fn()
}));

vi.mock('@supermarket/api-sdk', async () => {
  const actual = await vi.importActual<typeof import('@supermarket/api-sdk')>('@supermarket/api-sdk');

  return {
    ...actual,
    fetchServiceHealth: fetchServiceHealthMock,
    registerManagementProduct: registerManagementProductMock
  };
});

describe('Management application shell', () => {
  beforeEach(() => {
    window.localStorage.clear();
    fetchServiceHealthMock.mockReset();
    registerManagementProductMock.mockReset();

    fetchServiceHealthMock.mockResolvedValue({
      serviceName: 'management-service',
      status: 'ok',
      timestamp: '2026-06-14T00:00:00.000Z'
    });

    registerManagementProductMock.mockResolvedValue({
      productId: '0b4f3405-a406-4bbd-b4fe-ec85f7765d20',
      tenantId: '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1',
      name: 'Arabica Coffee Beans',
      barcode: '7891234567890',
      unitOfMeasure: 'UN',
      currentPrice: 22.9,
      active: true,
      eventPublicationStatus: 'published'
    });
  });

  it('registers a product from the management workspace', async () => {
    const user = userEvent.setup();

    render(<App />);

    await screen.findByText(/Healthy/i);

    await user.type(screen.getByLabelText(/Product name/i), 'Arabica Coffee Beans');
    await user.type(screen.getByLabelText(/^Barcode/i), '7891234567890');
    await user.clear(screen.getByLabelText(/Current price/i));
    await user.type(screen.getByLabelText(/Current price/i), '22.90');
    await user.click(screen.getByRole('button', { name: /Register product/i }));

    await screen.findByText(/Product registered/i);

    expect(registerManagementProductMock).toHaveBeenCalledWith(
      {
        tenantId: '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1',
        name: 'Arabica Coffee Beans',
        barcode: '7891234567890',
        unitOfMeasure: 'UN',
        price: 22.9
      },
      {
        baseUrl: 'http://localhost:3003'
      }
    );
  });
});
