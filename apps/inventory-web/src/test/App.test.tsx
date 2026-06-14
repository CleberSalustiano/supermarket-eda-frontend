import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { App } from '../App';

vi.mock('@supermarket/api-sdk', async () => {
  const actual = await vi.importActual<typeof import('@supermarket/api-sdk')>('@supermarket/api-sdk');

  return {
    ...actual,
    fetchServiceHealth: vi.fn().mockResolvedValue({
      serviceName: 'inventory-service',
      status: 'ok',
      timestamp: '2026-06-13T00:00:00.000Z'
    })
  };
});

describe('Inventory application shell', () => {
  it('renders the inventory headline', async () => {
    render(<App />);

    screen.getByText(/Operational stock control without interface noise/i);
    await screen.findByText(/Healthy/i);
  });
});
