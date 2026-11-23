import { useMemo, useState } from 'react';

import { createDevTenantOverrideStore, type FrontendRuntimeConfig } from '@supermarket/frontend-config';

const TENANT_OVERRIDE_STORAGE_KEY = 'supermarket.checkout.devTenant';

export interface TenantSelection {
  tenantId: string;
  override: string | null;
  setOverride: (value: string) => void;
  clearOverride: () => void;
}

/** The active tenant is the dev-only override when one is stored, otherwise the configured tenant. */
export function useTenantSelection(config: FrontendRuntimeConfig): TenantSelection {
  const store = useMemo(
    () => createDevTenantOverrideStore(TENANT_OVERRIDE_STORAGE_KEY, config),
    [config]
  );
  const [override, setOverrideState] = useState<string | null>(() => store.read());

  return {
    tenantId: override ?? config.tenantId,
    override,
    setOverride: (value) => {
      store.write(value);
      setOverrideState(store.read());
    },
    clearOverride: () => {
      store.clear();
      setOverrideState(null);
    }
  };
}
