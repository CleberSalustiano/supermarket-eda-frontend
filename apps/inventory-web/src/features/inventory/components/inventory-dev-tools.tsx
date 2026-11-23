import { createDevTenantOverrideStore, type FrontendRuntimeConfig } from '@supermarket/frontend-config';
import { Button, DevToolsPanel, TextField, useDevToolsMessages } from '@supermarket/frontend-ui';
import { useMemo, useState } from 'react';

export const inventoryDevTenantStorageKey = 'supermarket.inventory.devTenant';

export function InventoryDevTools({ config }: { config: FrontendRuntimeConfig }) {
  const m = useDevToolsMessages();
  const store = useMemo(() => createDevTenantOverrideStore(inventoryDevTenantStorageKey, config), [config]);
  const [tenantId, setTenantId] = useState(() => store.read() ?? config.tenantId);

  return (
    <DevToolsPanel>
      <div className="flex flex-col gap-4">
        <TextField
          label={m.tenant}
          value={tenantId}
          onChange={(event) => {
            setTenantId(event.target.value);
            store.write(event.target.value);
          }}
        />
        <div>
          <p className="text-small font-bold text-ink">{m.urls}</p>
          <ul className="text-small text-ink-muted">
            {Object.entries(config.serviceBaseUrls).map(([service, url]) => (
              <li key={service}>
                {service}: {url}
              </li>
            ))}
          </ul>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            store.clear();
            setTenantId(config.tenantId);
          }}
        >
          {m.clear}
        </Button>
      </div>
    </DevToolsPanel>
  );
}
