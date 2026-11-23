import { useState } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FrontendRuntimeConfig, RuntimeConfigResult } from '@supermarket/frontend-config';
import { ConfigurationErrorScreen, ThemeProvider } from '@supermarket/frontend-ui';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { runtimeConfigResult } from './environment';
import { catalogs, I18nProvider } from './i18n';
import { CashierPage } from './pages/CashierPage';

export function CheckoutRoutes({ config }: { config: FrontendRuntimeConfig }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30_000 } } })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CashierPage config={config} />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export function App({ configResult = runtimeConfigResult }: { configResult?: RuntimeConfigResult }) {
  if (!configResult.ok) {
    return (
      <ThemeProvider>
        <ConfigurationErrorScreen missing={configResult.missing} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <I18nProvider catalogs={catalogs} defaultLocale={configResult.config.defaultLocale}>
        <CheckoutRoutes config={configResult.config} />
      </I18nProvider>
    </ThemeProvider>
  );
}
