import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '../test/render-with-providers';
import { Dialog } from './dialog';

describe('Dialog', () => {
  it('opens as a modal with a labelled title and footer', () => {
    renderWithProviders(
      <Dialog open onClose={vi.fn()} title="Cancelar venda" footer={<button>Voltar</button>}>
        <p>Corpo</p>
      </Dialog>
    );
    expect(screen.getByRole('dialog', { name: 'Cancelar venda' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
  });

  it('stays closed when open is false', () => {
    renderWithProviders(
      <Dialog open={false} onClose={vi.fn()} title="Fechar caixa">
        <p>Corpo</p>
      </Dialog>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose once on Escape', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <Dialog open onClose={onClose} title="Fechar caixa">
        <input aria-label="Valor" />
      </Dialog>
    );
    screen.getByLabelText('Valor').focus();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
