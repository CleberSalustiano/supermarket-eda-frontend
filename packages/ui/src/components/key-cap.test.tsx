import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '../test/render-with-providers';
import { KeyCap } from './key-cap';

describe('KeyCap', () => {
  it('renders a kbd element', () => {
    renderWithProviders(<KeyCap>Esc</KeyCap>);
    expect(screen.getByText('Esc').tagName).toBe('KBD');
  });
});
