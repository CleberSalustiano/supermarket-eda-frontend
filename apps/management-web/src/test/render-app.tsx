import { developmentDefaults, resolveFrontendRuntimeConfig } from '@supermarket/frontend-config';
import type { Locale } from '@supermarket/frontend-i18n';
import { renderWithProviders } from '@supermarket/frontend-ui/test';
import { QueryClientProvider } from '@tanstack/react-query';
import type { RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { createQueryClient, ManagementRoutes } from '../App';
import { catalogs, I18nProvider } from '../i18n';

const result = resolveFrontendRuntimeConfig({ MODE: 'test' }, ['management', 'checkout'], developmentDefaults);

if (!result.ok) {
  throw new Error('Test runtime config must resolve');
}

export const testConfig = result.config;

export function renderApp({ locale = 'pt-BR', route = '/produtos' }: { locale?: Locale; route?: string } = {}): RenderResult {
  return renderWithProviders(
    <I18nProvider catalogs={catalogs} defaultLocale={locale}>
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter initialEntries={[route]}>
          <ManagementRoutes config={testConfig} />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nProvider>,
    { locale }
  );
}
