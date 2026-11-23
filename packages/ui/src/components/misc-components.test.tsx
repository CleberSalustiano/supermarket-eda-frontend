import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '../test/render-with-providers';
import { ConfigurationErrorScreen } from './configuration-error-screen';
import { ConnectionBanner } from './connection-banner';
import { DataTable } from './data-table';
import { DevToolsPanel } from './dev-tools-panel';
import { EmptyState } from './empty-state';

describe('ConnectionBanner', () => {
  it('names the service and retries', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ConnectionBanner service="checkout" onRetry={onRetry} />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Sem conexão com o servidor do caixa. Tentando de novo a cada 15 segundos.'
    );
    await user.click(screen.getByRole('button', { name: 'Tentar agora' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('ConfigurationErrorScreen', () => {
  it('renders without any provider, in pt-BR, listing the missing variables', () => {
    // Plain render: the screen must work before configuration (and any provider) exists.
    render(<ConfigurationErrorScreen missing={['FRONTEND_TENANT_ID', 'FRONTEND_CHECKOUT_API_BASE_URL']} />);
    expect(screen.getByRole('heading', { name: 'Configuração incompleta' })).toBeInTheDocument();
    expect(screen.getByText('FRONTEND_TENANT_ID')).toBeInTheDocument();
    expect(screen.getByText('FRONTEND_CHECKOUT_API_BASE_URL')).toBeInTheDocument();
  });
});

describe('DevToolsPanel', () => {
  it('toggles the panel', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DevToolsPanel>
        <p>conteúdo dev</p>
      </DevToolsPanel>
    );
    expect(screen.queryByText('conteúdo dev')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ferramentas de desenvolvimento' }));
    expect(screen.getByText('conteúdo dev')).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders title, body and action', () => {
    renderWithProviders(<EmptyState title="Vazio" body="Nada aqui" action={<button>Fazer</button>} />);
    expect(screen.getByRole('heading', { name: 'Vazio' })).toBeInTheDocument();
    expect(screen.getByText('Nada aqui')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fazer' })).toBeInTheDocument();
  });
});

describe('DataTable', () => {
  it('renders headers and rows with right-aligned tabular numbers', () => {
    renderWithProviders(
      <DataTable
        caption="Por dia"
        rows={[{ id: '1', day: '01/11', total: 'R$ 10,00' }]}
        rowKey={(row) => row.id}
        columns={[
          { key: 'day', header: 'Data', render: (row) => row.day },
          { key: 'total', header: 'Total', align: 'right', render: (row) => row.total }
        ]}
      />
    );
    expect(screen.getByRole('columnheader', { name: 'Data' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'R$ 10,00' })).toHaveClass('text-right', 'tabular-nums');
  });
});
