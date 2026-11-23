import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { useState, type ReactElement, type ReactNode } from 'react';

import type { Locale } from '@supermarket/frontend-i18n';

import { UiI18nProvider } from '../i18n/ui-i18n';
import { ThemeProvider } from '../theme/theme-provider';

export type RenderWithProvidersOptions = {
  locale?: Locale;
  theme?: 'system' | 'light' | 'dark';
} & Omit<RenderOptions, 'wrapper'>;

export function renderWithProviders(
  ui: ReactElement,
  { locale = 'pt-BR', theme = 'light', ...options }: RenderWithProvidersOptions = {}
): RenderResult {
  if (theme !== 'system') {
    window.localStorage.setItem('supermarket.theme', theme);
  }
  function Wrapper({ children }: { children: ReactNode }) {
    const [current, setCurrent] = useState<Locale>(locale);
    return (
      <ThemeProvider>
        <UiI18nProvider
          locale={current}
          setLocale={(next) => {
            document.documentElement.lang = next;
            setCurrent(next);
          }}
        >
          {children}
        </UiI18nProvider>
      </ThemeProvider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}
