import { isUuidV4 } from '@supermarket/frontend-config';
import { DevToolsPanel, TextField, Button, useDevToolsMessages } from '@supermarket/frontend-ui';
import { useState } from 'react';

import { useManagement } from '../management-context';

const localDataPrefix = 'supermarket.management.';

function clearLocalData(): void {
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith(localDataPrefix)) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // Storage unavailable: nothing to clear.
  }

  window.location.reload();
}

export function ManagementDevTools() {
  const ui = useDevToolsMessages();
  const { config, tenantId, setTenantOverride } = useManagement();
  const [draft, setDraft] = useState(tenantId);

  if (!config.devToolsEnabled) {
    return null;
  }

  return (
    <DevToolsPanel>
      <div className="flex flex-col gap-4">
        <TextField
          label={ui.tenant}
          value={draft}
          onChange={(event) => {
            const next = event.target.value.trim();

            setDraft(event.target.value);

            if (isUuidV4(next)) {
              setTenantOverride(next);
            }
          }}
        />
        <div className="flex flex-col gap-1 text-small">
          <p className="font-bold">{ui.urls}</p>
          {Object.entries(config.serviceBaseUrls).map(([service, url]) => (
            <p key={service}>
              {service}: {url}
            </p>
          ))}
        </div>
        <Button variant="secondary" onClick={clearLocalData}>
          {ui.clear}
        </Button>
      </div>
    </DevToolsPanel>
  );
}
