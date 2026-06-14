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
  BadgeDollarSign,
  CreditCard,
  ReceiptText,
  ScanLine
} from 'lucide-react';

import { checkoutServiceBaseUrl } from '../environment';

const navigationItems = [
  {
    label: 'Session control',
    description: 'Open and close cashier sessions with explicit operational boundaries.'
  },
  {
    label: 'Sale execution',
    description: 'Drive barcode scan, cart mutation, payment, and completion flows locally.'
  },
  {
    label: 'Exception handling',
    description: 'Support cancellation and closure flows with strong state validation.'
  }
] as const;

const actionCards = [
  {
    title: 'Open sessions',
    description: 'Prepare the register context before the operator begins a sale cycle.',
    footer: 'Backed by POST /pos-sessions',
    icon: <ReceiptText className="size-5" />
  },
  {
    title: 'Scan and build carts',
    description: 'Resolve catalog items locally, then add or remove them without service-to-service latency.',
    footer: 'Backed by GET /catalog-items and POST /sales/:saleId/items',
    icon: <ScanLine className="size-5" />
  },
  {
    title: 'Process payment',
    description: 'Capture cashier payment progress before a sale becomes terminal.',
    footer: 'Backed by POST /sales/:saleId/payment',
    icon: <CreditCard className="size-5" />
  },
  {
    title: 'Complete and cancel safely',
    description: 'Handle terminal sale transitions and managed exceptions with explicit backend rules.',
    footer: 'Backed by completion, cancellation, and session closure routes',
    icon: <BadgeDollarSign className="size-5" />
  }
] as const;

export function CheckoutDashboardPage() {
  const healthQuery = useQuery({
    queryKey: ['service-health', 'checkout'],
    queryFn: () => fetchServiceHealth('checkout', { baseUrl: checkoutServiceBaseUrl })
  });

  return (
    <AppShell
      eyebrow="Checkout Web"
      title="High-clarity POS foundations for fast execution."
      description="This shell is tuned for low-noise cashier workflows and prepares the ground for keyboard-first sale execution."
      navigationItems={navigationItems.map((item) => ({ ...item }))}
      sidebarFooter={
        <div className="rounded-2xl border border-line bg-white/75 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">API target</p>
          <p className="mt-2 font-mono text-sm text-ink">
            {checkoutServiceBaseUrl}
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Primary flow"
            value="POS live path"
            detail="The existing backend already supports session, cart, payment, completion, and cancellation operations."
            icon={<ScanLine className="size-5" />}
          />
          <MetricCard
            label="Operator speed"
            value="Keyboard first"
            detail="The design direction is intentionally sparse so the cashier flow can stay fast and readable."
            icon={<CreditCard className="size-5" />}
            tone="accent"
          />
          <MetricCard
            label="Pending backend reads"
            value="History gap"
            detail="Session and sale query endpoints are still missing for support-oriented screens."
            icon={<ReceiptText className="size-5" />}
          />
        </div>

        <AppSection
          title="Backend readiness"
          description="This foundation pings the checkout service directly so the web shell reflects real backend availability."
        >
          <div className="flex flex-col gap-4 rounded-3xl border border-line bg-white/80 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Checkout service health</p>
              <p className="mt-1 text-sm text-muted">
                Confirms that the local POS backend is reachable before richer sale flows land.
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
              <li>{backendServices.checkout.routes.openPosSession}</li>
              <li>{backendServices.checkout.routes.startSale}</li>
              <li>{backendServices.checkout.routes.addSaleItem(':saleId')}</li>
              <li>{backendServices.checkout.routes.processSalePayment(':saleId')}</li>
              <li>{backendServices.checkout.routes.completeSale(':saleId')}</li>
              <li>{backendServices.checkout.routes.cancelSale(':saleId')}</li>
            </ul>
          </div>
        </AppSection>

        <AppSection
          title="MVP feature lanes"
          description="The first checkout slice should preserve operational speed while progressively layering stronger validation and visibility."
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
