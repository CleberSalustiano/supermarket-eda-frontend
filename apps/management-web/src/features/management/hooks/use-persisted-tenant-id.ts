import { useEffect, useState } from 'react';

import { defaultManagementTenantId, managementTenantStorageKey } from '../lib/tenant';

export function usePersistedTenantId(): [string, (value: string) => void] {
  const [tenantId, setTenantId] = useState(() => {
    if (typeof window === 'undefined') {
      return defaultManagementTenantId;
    }

    const persistedValue = window.localStorage.getItem(managementTenantStorageKey);

    if (persistedValue !== null && persistedValue.trim().length > 0) {
      return persistedValue.trim();
    }

    return defaultManagementTenantId;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(managementTenantStorageKey, tenantId);
  }, [tenantId]);

  return [tenantId, setTenantId];
}
