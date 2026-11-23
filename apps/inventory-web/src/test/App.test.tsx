import { fetchServiceHealth } from '@supermarket/api-sdk';
import type { RuntimeConfigResult } from '@supermarket/frontend-config';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderApp } from './render-app';

const environment = vi.hoisted(() => ({
  result: undefined as unknown as RuntimeConfigResult
}));

vi.mock('../environment', () => ({
  get runtimeConfigResult() {
    return environment.result;
  }
}));

vi.mock('@supermarket/api-sdk', async () => {
  const actual = await vi.importActual<typeof import('@supermarket/api-sdk')>('@supermarket/api-sdk');

  return { ...actual, fetchServiceHealth: vi.fn() };
});

const okConfig: RuntimeConfigResult = {
  ok: true,
  config: {
    mode: 'test',
    tenantId: '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1',
    serviceBaseUrls: { inventory: 'http://inventory.test' },
    checkoutRegisterId: null,
    developmentOperatorId: null,
    defaultLocale: 'pt-BR',
    devToolsEnabled: false
  }
};

const healthy = {
  serviceName: 'inventory-service',
  status: 'ok' as const,
  timestamp: '2026-06-13T00:00:00.000Z'
};

describe('Inventory application shell', () => {
  beforeEach(() => {
    environment.result = okConfig;
    vi.mocked(fetchServiceHealth).mockResolvedValue(healthy);
  });

  afterEach(() => {
    cleanup();
    vi.mocked(fetchServiceHealth).mockReset();
  });

  it('shows the empty state and the home navigation item', async () => {
    renderApp();

    expect(await screen.findByRole('heading', { name: 'Nenhuma operação de estoque disponível ainda' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Início' })).toBeVisible();
    expect(screen.getByText('Estoque')).toBeVisible();
  });

  it('keeps showcase content out of the screen', async () => {
    renderApp();

    await screen.findByRole('heading', { name: 'Nenhuma operação de estoque disponível ainda' });

    expect(screen.queryByText(/Operational stock control/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Healthy/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/POST \//)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tenant id/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ferramentas de desenvolvimento/)).not.toBeInTheDocument();
  });

  it('hides the connection banner while the service is healthy', async () => {
    renderApp();

    await waitFor(() => expect(fetchServiceHealth).toHaveBeenCalledWith('inventory', { baseUrl: 'http://inventory.test' }));
    expect(screen.queryByText(/Sem conexão/)).not.toBeInTheDocument();
  });

  it('shows the connection banner on a health error and retries on demand', async () => {
    vi.mocked(fetchServiceHealth).mockRejectedValue(new Error('offline'));
    renderApp();

    expect(await screen.findByText(/Sem conexão com o servidor do estoque/)).toBeVisible();

    vi.mocked(fetchServiceHealth).mockResolvedValue(healthy);
    await userEvent.click(screen.getByRole('button', { name: 'Tentar agora' }));

    await waitFor(() => expect(screen.queryByText(/Sem conexão/)).not.toBeInTheDocument());
  });

  it('lists the missing variables on the configuration error screen', () => {
    environment.result = { ok: false, missing: ['FRONTEND_TENANT_ID', 'FRONTEND_INVENTORY_API_BASE_URL'] };
    renderApp();

    expect(screen.getByRole('heading', { name: 'Configuração incompleta' })).toBeVisible();
    expect(screen.getByText('FRONTEND_TENANT_ID')).toBeVisible();
    expect(screen.getByText('FRONTEND_INVENTORY_API_BASE_URL')).toBeVisible();
    expect(fetchServiceHealth).not.toHaveBeenCalled();
  });

  it('switches to English through Preferences', async () => {
    renderApp();

    await userEvent.click(await screen.findByRole('button', { name: 'Preferências' }));
    await userEvent.click(screen.getByRole('radio', { name: 'English' }));

    expect(await screen.findByRole('heading', { name: 'No inventory operations available yet' })).toBeVisible();
    expect(document.documentElement.lang).toBe('en');
  });
});
