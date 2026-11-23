import type { Locale } from '@supermarket/frontend-i18n';
import { renderWithProviders } from '@supermarket/frontend-ui/test';
import type { RenderResult } from '@testing-library/react';

import { App } from '../App';

/** Renders the whole app in the given locale (pt-BR by default). The app mounts its own I18nProvider. */
export function renderApp({ locale = 'pt-BR' }: { locale?: Locale } = {}): RenderResult {
  window.localStorage.clear();
  window.localStorage.setItem('supermarket.locale', locale);
  return renderWithProviders(<App />, { locale });
}
