import type { FrontendRuntimeConfig } from '@supermarket/frontend-config';
import { fetchServiceHealth } from '@supermarket/api-sdk';
import {
  AppFrame,
  ConfigurationErrorScreen,
  ConnectionBanner,
  ThemeProvider
} from '@supermarket/frontend-ui';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ManagementProvider, useManagement } from './features/management/management-context';
import { catalogs, I18nProvider, useI18n } from './i18n';
import { runtimeConfigResult } from './environment';
import { EmployeesPage } from './pages/EmployeesPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProfitAndLossPage } from './pages/ProfitAndLossPage';

const healthRefetchIntervalMs = 15_000;

// Statically removed from production builds, so no developer tooling ships to users.
const ManagementDevTools =
  import.meta.env.MODE === 'production'
    ? null
    : lazy(() =>
        import('./features/management/components/management-dev-tools').then((module) => ({
          default: module.ManagementDevTools
        }))
      );

export function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30_000 } } });
}

function ManagementLayout() {
  const { m } = useI18n();
  const { managementBaseUrl } = useManagement();
  const health = useQuery({
    queryKey: ['service-health', 'management'],
    queryFn: () => fetchServiceHealth('management', { baseUrl: managementBaseUrl }),
    refetchInterval: healthRefetchIntervalMs
  });

  return (
    <AppFrame
      appName={m.app.name}
      nav={[
        { to: '/produtos', label: m.nav.products },
        { to: '/funcionarios', label: m.nav.employees },
        { to: '/resultado', label: m.nav.results }
      ]}
      banner={
        health.isError ? (
          <ConnectionBanner
            service="management"
            onRetry={() => {
              void health.refetch();
            }}
          />
        ) : null
      }
    >
      <Routes>
        <Route path="/" element={<Navigate to="/produtos" replace />} />
        <Route path="/produtos" element={<ProductsPage />} />
        <Route path="/funcionarios" element={<EmployeesPage />} />
        <Route path="/resultado" element={<ProfitAndLossPage />} />
      </Routes>
      {ManagementDevTools === null ? null : (
        <Suspense fallback={null}>
          <ManagementDevTools />
        </Suspense>
      )}
    </AppFrame>
  );
}

/** Everything below the router and providers; shared by the app and the test helper. */
export function ManagementRoutes({ config }: { config: FrontendRuntimeConfig }) {
  return (
    <ManagementProvider config={config}>
      <ManagementLayout />
    </ManagementProvider>
  );
}

const queryClient = createQueryClient();

export function App() {
  if (!runtimeConfigResult.ok) {
    return (
      <ThemeProvider>
        <ConfigurationErrorScreen missing={runtimeConfigResult.missing} />
      </ThemeProvider>
    );
  }

  const { config } = runtimeConfigResult;

  return (
    <ThemeProvider>
      <I18nProvider catalogs={catalogs} defaultLocale={config.defaultLocale}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ManagementRoutes config={config} />
          </BrowserRouter>
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
