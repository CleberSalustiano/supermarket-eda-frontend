import { createDevTenantOverrideStore, type FrontendRuntimeConfig } from '@supermarket/frontend-config';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export const managementTenantOverrideKey = 'supermarket.management.devTenant';

export type ManagementContextValue = {
  config: FrontendRuntimeConfig;
  tenantId: string;
  managementBaseUrl: string | undefined;
  checkoutBaseUrl: string | undefined;
  setTenantOverride: (tenantId: string | null) => void;
};

const ManagementContext = createContext<ManagementContextValue | null>(null);

export function ManagementProvider({ config, children }: { config: FrontendRuntimeConfig; children: ReactNode }) {
  const store = useMemo(() => createDevTenantOverrideStore(managementTenantOverrideKey, config), [config]);
  const [override, setOverride] = useState<string | null>(() => store.read());

  const value = useMemo<ManagementContextValue>(
    () => ({
      config,
      tenantId: override ?? config.tenantId,
      managementBaseUrl: config.serviceBaseUrls.management,
      checkoutBaseUrl: config.serviceBaseUrls.checkout,
      setTenantOverride: (tenantId) => {
        if (tenantId === null) {
          store.clear();
        } else {
          store.write(tenantId);
        }
        setOverride(tenantId);
      }
    }),
    [config, override, store]
  );

  return <ManagementContext.Provider value={value}>{children}</ManagementContext.Provider>;
}

export function useManagement(): ManagementContextValue {
  const value = useContext(ManagementContext);

  if (value === null) {
    throw new Error('useManagement must be used inside a ManagementProvider');
  }

  return value;
}
