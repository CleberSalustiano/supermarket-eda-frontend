import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../environment', () => ({
  runtimeConfigResult: { ok: false, missing: ['FRONTEND_TENANT_ID', 'FRONTEND_MANAGEMENT_API_BASE_URL'] }
}));

import { App } from '../App';

describe('Management configuration error', () => {
  it('shows the configuration error screen instead of the app when config is missing', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Configuração incompleta' })).toBeInTheDocument();
    expect(screen.getByText('FRONTEND_TENANT_ID')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
