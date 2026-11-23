import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { fetchServiceHealth } from '@supermarket/api-sdk';
import type { FrontendRuntimeConfig } from '@supermarket/frontend-config';
import {
  AppFrame,
  ConfigurationErrorScreen,
  ConnectionBanner,
  ThemeProvider
} from '@supermarket/frontend-ui';
import { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { runtimeConfigResult } from './environment';
import { catalogs, I18nProvider, useI18n } from './i18n';
import { InventoryHomePage } from './pages/InventoryHomePage';

const healthRefetchIntervalMs = 15_000;

// Statically removed from production builds, so no developer tooling ships to users.
const InventoryDevTools =
  import.meta.env.MODE === 'production'
    ? null
    : lazy(() =>
        import('./features/inventory/components/inventory-dev-tools').then((module) => ({
          default: module.InventoryDevTools
        }))
      );

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 30_000
      }
    }
  });
}

function InventoryShell({ config }: { config: FrontendRuntimeConfig }) {
  const { m } = useI18n();
  const healthQuery = useQuery({
    queryKey: ['service-health', 'inventory'],
    queryFn: () => fetchServiceHealth('inventory', { baseUrl: config.serviceBaseUrls.inventory }),
    refetchInterval: healthRefetchIntervalMs
  });

  return (
    <>
      <AppFrame
        appName={m.app.name}
        nav={[{ to: '/', label: m.nav.home }]}
        banner={
          healthQuery.isError ? (
            <ConnectionBanner service="inventory" onRetry={() => void healthQuery.refetch()} />
          ) : undefined
        }
      >
        <Routes>
          <Route path="/" element={<InventoryHomePage />} />
        </Routes>
      </AppFrame>
      {config.devToolsEnabled && InventoryDevTools !== null ? (
        <Suspense fallback={null}>
          <InventoryDevTools config={config} />
        </Suspense>
      ) : null}
    </>
  );
}

function ConfiguredApp({ config }: { config: FrontendRuntimeConfig }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <ThemeProvider>
      <I18nProvider catalogs={catalogs} defaultLocale={config.defaultLocale}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <InventoryShell config={config} />
          </BrowserRouter>
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

export function App() {
  if (!runtimeConfigResult.ok) {
    return (
      <ThemeProvider>
        <ConfigurationErrorScreen missing={runtimeConfigResult.missing} />
      </ThemeProvider>
    );
  }

  return <ConfiguredApp config={runtimeConfigResult.config} />;
}
