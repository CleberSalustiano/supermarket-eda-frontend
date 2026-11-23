import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '../test/render-with-providers';
import { PreferencesMenu } from './preferences-menu';

describe('PreferencesMenu', () => {
  it('changes the theme and persists it', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PreferencesMenu />, { theme: 'light' });
    await user.click(screen.getByRole('button', { name: 'Preferências' }));
    await user.click(screen.getByRole('radio', { name: 'Escuro' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem('supermarket.theme')).toBe('dark');
    await user.click(screen.getByRole('radio', { name: 'Sistema' }));
    expect(document.documentElement.dataset.themePreference).toBe('system');
  });

  it('changes the language, the catalog text and <html lang>', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PreferencesMenu />);
    await user.click(screen.getByRole('button', { name: 'Preferências' }));
    await user.click(screen.getByRole('radio', { name: 'English' }));
    expect(document.documentElement.lang).toBe('en');
    expect(screen.getByRole('button', { name: 'Preferences' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeInTheDocument();
  });
});
