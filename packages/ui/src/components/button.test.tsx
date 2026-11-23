import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '../test/render-with-providers';
import { Button } from './button';

describe('Button', () => {
  it('renders the shortcut as a kbd', () => {
    renderWithProviders(<Button shortcut="F8">Receber pagamento</Button>);
    expect(screen.getByRole('button', { name: /Receber pagamento/ })).toBeInTheDocument();
    expect(screen.getByText('F8').tagName).toBe('KBD');
  });

  it('uses a real disabled attribute and variant classes', () => {
    renderWithProviders(
      <Button variant="danger" disabled>
        Cancelar
      </Button>
    );
    const button = screen.getByRole('button', { name: 'Cancelar' });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('bg-danger', 'text-on-danger');
  });
});
