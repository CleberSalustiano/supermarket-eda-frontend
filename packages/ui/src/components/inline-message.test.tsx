import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '../test/render-with-providers';
import { InlineMessage } from './inline-message';

describe('InlineMessage', () => {
  it('uses role alert for danger with detail and support code', () => {
    renderWithProviders(<InlineMessage tone="danger" title="Falhou" detail="boom" supportCode="abc" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Falhou');
    expect(alert).toHaveTextContent('Detalhe do servidor: boom');
    expect(alert).toHaveTextContent('Código para suporte: abc');
  });

  it('uses role status for other tones and translates in English', () => {
    renderWithProviders(<InlineMessage tone="success" title="Ok" detail="x" />, { locale: 'en' });
    expect(screen.getByRole('status')).toHaveTextContent('Server detail: x');
  });
});
