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
  BarChart3,
  BadgeDollarSign,
  Boxes,
  ShieldUser
} from 'lucide-react';

import { managementServiceBaseUrl } from '../environment';

const navigationItems = [
  {
    label: 'Catalog control',
    description: 'Product registration and price updates for downstream synchronization.'
  },
  {
    label: 'People access',
    description: 'Employee onboarding and operational role allocation.'
  },
  {
    label: 'Financial visibility',
    description: 'Profit and loss access with room for reconciliation expansion.'
  }
] as const;

const actionCards = [
  {
    title: 'Register products',
    description: 'Prepare the canonical catalog that feeds checkout and management processes.',
    footer: 'Backed by POST /products',
    icon: <Boxes className="size-5" />
  },
  {
    title: 'Update pricing',
    description: 'Control price changes with explicit downstream propagation from management.',
    footer: 'Backed by PUT /products/:productId/price',
    icon: <BadgeDollarSign className="size-5" />
  },
  {
    title: 'Register employees',
    description: 'Create manager, cashier, and admin records for operational authorization flows.',
    footer: 'Backed by POST /employees',
    icon: <ShieldUser className="size-5" />
  },
  {
    title: 'Review P&L',
    description: 'Query period-based profit and loss while finance read endpoints continue to expand.',
    footer: 'Backed by GET /reports/profit-and-loss',
    icon: <BarChart3 className="size-5" />
  }
] as const;

export function ManagementDashboardPage() {
  const healthQuery = useQuery({
    queryKey: ['service-health', 'management'],
    queryFn: () => fetchServiceHealth('management', { baseUrl: managementServiceBaseUrl })
  });

  return (
    <AppShell
      eyebrow="Management Web"
      title="Operational command with low-noise design."
      description="A minimal control surface for catalog, people, and finance workflows, built to grow into production without visual churn."
      navigationItems={navigationItems.map((item) => ({ ...item }))}
      sidebarFooter={
        <div className="rounded-2xl border border-line bg-white/75 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">API target</p>
          <p className="mt-2 font-mono text-sm text-ink">
            {managementServiceBaseUrl}
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Live integrations"
            value="4 routes"
            detail="Current management HTTP surface already covers product, pricing, employee, and P&L flows."
            icon={<Boxes className="size-5" />}
          />
          <MetricCard
            label="Reporting"
            value="P&L ready"
            detail="Reporting can start now through the existing date-filtered profit-and-loss endpoint."
            icon={<BarChart3 className="size-5" />}
            tone="accent"
          />
          <MetricCard
            label="Expansion need"
            value="Read models"
            detail="Product list, employee list, reconciliation, and daily finance reads are still missing."
            icon={<ShieldUser className="size-5" />}
          />
        </div>

        <AppSection
          title="Backend readiness"
          description="The foundation already verifies live connectivity with the management service."
        >
          <div className="flex flex-col gap-4 rounded-3xl border border-line bg-white/80 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Management service health</p>
              <p className="mt-1 text-sm text-muted">
                Checks the current backend directly through the shared API client.
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
              <li>{backendServices.management.routes.registerProduct}</li>
              <li>{backendServices.management.routes.updateProductPrice(':productId')}</li>
              <li>{backendServices.management.routes.registerEmployee}</li>
              <li>{backendServices.management.routes.generateProfitAndLossReport}</li>
            </ul>
          </div>
        </AppSection>

        <AppSection
          title="MVP feature lanes"
          description="These tiles correspond to the first real workflows that the management frontend can start shipping immediately."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {actionCards.map((actionCard) => (
              <ActionCard key={actionCard.title} {...actionCard} />
            ))}
          </div>
        </AppSection>
      </div>
    </AppShell>
  );
}
