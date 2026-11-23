import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '../test/render-with-providers';
import { PriceTag } from './price-tag';

describe('PriceTag', () => {
  it('labels the total in pt-BR with a comma separator', () => {
    renderWithProviders(<PriceTag value={22.9} size="xl" label="Total da venda" />);
    const tag = screen.getByRole('img');
    expect(tag.getAttribute('aria-label')).toMatch(/^Total da venda: R\$\s22,90$/);
    expect(tag).toHaveTextContent('R$22,90');
  });

  it('uses a dot separator and en formatting in English', () => {
    renderWithProviders(<PriceTag value={1234.5} size="md" label="Sale total" />, { locale: 'en' });
    const tag = screen.getByRole('img');
    expect(tag).toHaveAttribute('aria-label', 'Sale total: R$1,234.50');
    expect(tag).toHaveTextContent('R$1,234.50');
  });

  it('keeps the visual spans hidden from assistive technology', () => {
    renderWithProviders(<PriceTag value={5} size="lg" label="Total" />);
    expect(screen.getByRole('img').querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });
});
