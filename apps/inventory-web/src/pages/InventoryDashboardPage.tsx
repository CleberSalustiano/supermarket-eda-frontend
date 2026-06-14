import { useQuery } from '@tanstack/react-query';
import { backendServices, fetchServiceHealth } from '@supermarket/api-sdk';
import {
  ActionCard,
  AppSection,
  AppShell,
  MetricCard,
  StatusPill
} from '@supermarket/frontend-ui';
import {
  AlertTriangle,
  ClipboardCheck,
  PackageCheck,
  Warehouse
} from 'lucide-react';

import { inventoryServiceBaseUrl } from '../environment';

const navigationItems = [
  {
    label: 'Receiving',
    description: 'Capture supplier invoice arrivals with controlled operational data entry.'
  },
  {
    label: 'Shrink control',
    description: 'Register losses and stock discrepancies with explicit audit context.'
  },
  {
    label: 'Physical count',
    description: 'Adjust counted stock safely while backend read models continue to expand.'
  }
] as const;

const actionCards = [
  {
    title: 'Receive supplier invoices',
    description: 'Convert inbound supplier batches into inventory entries with reliable form capture.',
    footer: 'Backed by POST /supplier-invoices',
    icon: <PackageCheck className="size-5" />
  },
  {
    title: 'Register losses',
    description: 'Track damaged, expired, or missing items without cluttering the operator flow.',
    footer: 'Backed by POST /inventory-losses',
    icon: <AlertTriangle className="size-5" />
  },
  {
    title: 'Adjust physical stock',
    description: 'Record counted quantities and threshold changes with clear audit inputs.',
    footer: 'Backed by POST /inventory-adjustments/physical',
    icon: <ClipboardCheck className="size-5" />
  }
] as const;

export function InventoryDashboardPage() {
  const healthQuery = useQuery({
    queryKey: ['service-health', 'inventory'],
    queryFn: () => fetchServiceHealth('inventory', { baseUrl: inventoryServiceBaseUrl })
  });

  return (
    <AppShell
      eyebrow="Inventory Web"
      title="Operational stock control without interface noise."
      description="This shell prepares the inventory application for high-confidence form workflows and clear audit capture."
      navigationItems={navigationItems.map((item) => ({ ...item }))}
      sidebarFooter={
        <div className="rounded-2xl border border-line bg-white/75 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">API target</p>
          <p className="mt-2 font-mono text-sm text-ink">
            {inventoryServiceBaseUrl}
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Operational focus"
            value="3 write flows"
            detail="Receiving, shrink registration, and physical adjustment are already ready to back the first UI forms."
            icon={<Warehouse className="size-5" />}
          />
          <MetricCard
            label="Workflow posture"
            value="Audit first"
            detail="The UI foundation is designed around explicit data capture and reduced operator ambiguity."
            icon={<ClipboardCheck className="size-5" />}
            tone="accent"
          />
          <MetricCard
            label="Pending backend reads"
            value="Monitoring gap"
            detail="Inventory history, low-stock review, and movement dashboards still need query endpoints."
            icon={<AlertTriangle className="size-5" />}
          />
        </div>

        <AppSection
          title="Backend readiness"
          description="The inventory shell verifies the live service before the richer form slices are implemented."
        >
          <div className="flex flex-col gap-4 rounded-3xl border border-line bg-white/80 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Inventory service health</p>
              <p className="mt-1 text-sm text-muted">
                Confirms the availability of the stock-operations backend from the browser shell.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {healthQuery.isPending ? <StatusPill tone="warning">Checking</StatusPill> : null}
              {healthQuery.isError ? <StatusPill tone="danger">Unavailable</StatusPill> : null}
              {healthQuery.isSuccess ? <StatusPill tone="success">Healthy</StatusPill> : null}
              <span className="font-mono text-xs text-muted">
                {healthQuery.data?.timestamp ?? 'No timestamp yet'}
              </span>
            </div>
          </div>
          <div className="mt-4 rounded-3xl border border-line bg-stone-950 px-5 py-4 text-stone-100">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
              Current route inventory
            </p>
            <ul className="mt-3 space-y-2 font-mono text-sm">
              <li>{backendServices.inventory.routes.registerSupplierInvoice}</li>
              <li>{backendServices.inventory.routes.registerInventoryLoss}</li>
              <li>{backendServices.inventory.routes.registerPhysicalInventoryAdjustment}</li>
            </ul>
          </div>
        </AppSection>

        <AppSection
          title="MVP feature lanes"
          description="The first inventory slice should stay narrow and safe: operators complete one auditable task at a time."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {actionCards.map((actionCard) => (
              <ActionCard key={actionCard.title} {...actionCard} />
            ))}
          </div>
        </AppSection>
      </div>
    </AppShell>
  );
}
