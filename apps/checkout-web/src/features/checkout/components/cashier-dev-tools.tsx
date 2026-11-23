import type { FrontendRuntimeConfig } from '@supermarket/frontend-config';
import { Button, DevToolsPanel, TextField, useDevToolsMessages } from '@supermarket/frontend-ui';
import { useState } from 'react';

import { useI18n } from '../../../i18n';
import type { TenantSelection } from '../hooks/use-tenant-override';

interface CashierDevToolsProps {
  config: FrontendRuntimeConfig;
  tenant: TenantSelection;
  tenantLocked: boolean;
  onClearLocalData: () => void;
}

/** Mounted only when `config.devToolsEnabled`, which is never true in production builds. */
export function CashierDevTools({ config, tenant, tenantLocked, onClearLocalData }: CashierDevToolsProps) {
  const { m } = useI18n();
  const ui = useDevToolsMessages();
  const [draft, setDraft] = useState(tenant.tenantId);

  return (
    <DevToolsPanel>
      <div className="flex flex-col gap-4">
        <TextField
          label={ui.tenant}
          hint={tenantLocked ? m.devTools.tenantLocked : undefined}
          value={draft}
          disabled={tenantLocked}
          onChange={(event) => {
            const value = event.target.value.trim();
            setDraft(value);
            tenant.setOverride(value);
          }}
        />
        <div className="flex flex-col gap-1">
          <span className="text-small font-bold text-ink">{ui.urls}</span>
          {Object.entries(config.serviceBaseUrls).map(([service, url]) => (
            <p key={service} className="break-all text-small text-ink-muted">
              {service}: {url}
            </p>
          ))}
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            tenant.clearOverride();
            setDraft(config.tenantId);
            onClearLocalData();
          }}
        >
          {ui.clear}
        </Button>
      </div>
    </DevToolsPanel>
  );
}
