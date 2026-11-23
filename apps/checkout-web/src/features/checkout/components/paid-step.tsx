import type { CheckoutSale } from '@supermarket/api-sdk';
import { Button } from '@supermarket/frontend-ui';

import { useI18n } from '../../../i18n';

interface PaidStepProps {
  sale: CheckoutSale;
  isPending: boolean;
  onComplete: () => void;
  /** False below 640px, where the sticky bottom bar already carries the primary action. */
  showPrimaryAction?: boolean;
}

export function PaidStep({ sale, isPending, onComplete, showPrimaryAction = true }: PaidStepProps) {
  const { m, fmt } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-heading text-ink">{m.paid.title}</h2>
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-body-lg tabular-nums">
        <dt className="text-ink-muted">{m.receipt.method}</dt>
        <dd className="text-ink">{sale.paymentMethod === null ? '' : m.payment.methods[sale.paymentMethod]}</dd>
        <dt className="text-ink-muted">{m.receipt.paid}</dt>
        <dd className="text-ink">{fmt.currency(sale.paidAmount ?? 0)}</dd>
      </dl>
      <div className="flex flex-col gap-1">
        <span className="text-small font-bold text-ink">{m.payment.change}</span>
        <span className="font-display text-display-lg tabular-nums text-ink">
          {fmt.currency(sale.changeAmount ?? 0)}
        </span>
      </div>
      {showPrimaryAction ? (
        <div>
          <Button size="lg" shortcut="F9" disabled={isPending} onClick={onComplete}>
            {m.paid.complete}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
