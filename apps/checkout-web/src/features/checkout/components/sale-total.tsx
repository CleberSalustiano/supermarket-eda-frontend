import { PriceTag } from '@supermarket/frontend-ui';

import { useI18n } from '../../../i18n';

interface SaleTotalProps {
  total: number;
  itemCount: number;
  /** Below 640px: a sticky, single-row total. */
  compact?: boolean;
}

export function SaleTotal({ total, itemCount, compact = false }: SaleTotalProps) {
  const { m } = useI18n();

  if (compact) {
    return (
      <div className="sticky top-0 z-10 -mx-4 -mt-4 flex items-center justify-between gap-3 border-b border-rule bg-floor px-4 py-2">
        <div className="flex min-w-0 flex-col">
          <h2 className="text-small font-bold text-ink">{m.total.label}</h2>
          <p className="text-small text-ink-muted tabular-nums">{m.items.count({ count: itemCount })}</p>
        </div>
        <PriceTag size="lg" value={total} label={m.total.label} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-heading text-ink">{m.total.label}</h2>
      <div>
        <PriceTag size="xl" value={total} label={m.total.label} />
      </div>
      <p className="text-body text-ink-muted tabular-nums">{m.items.count({ count: itemCount })}</p>
    </div>
  );
}
