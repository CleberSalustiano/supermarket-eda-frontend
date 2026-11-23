import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '../test/render-with-providers';
import { MoneyField } from './money-field';
import { SelectField } from './select-field';
import { TextField } from './text-field';

describe('form fields', () => {
  it('TextField links hint and error and flags invalid state', () => {
    renderWithProviders(<TextField label="Nome" hint="Dica" error="Erro" />);
    const input = screen.getByLabelText('Nome');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Dica Erro');
    expect(screen.getByRole('alert')).toHaveTextContent('Erro');
  });

  it('TextField has no invalid state or alert without error', () => {
    renderWithProviders(<TextField label="Nome" hint="Dica" />);
    expect(screen.getByLabelText('Nome')).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('SelectField links hint and error', () => {
    renderWithProviders(
      <SelectField label="Unidade" hint="Dica" error="Erro">
        <option value="UN">UN</option>
      </SelectField>
    );
    const select = screen.getByLabelText('Unidade');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAccessibleDescription('Dica Erro');
  });

  it('MoneyField shows the currency prefix and a decimal keypad', () => {
    renderWithProviders(<MoneyField label="Preço" error="Erro" />);
    const input = screen.getByLabelText('Preço');
    expect(input).toHaveAttribute('inputmode', 'decimal');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('R$')).toBeInTheDocument();
  });
});
