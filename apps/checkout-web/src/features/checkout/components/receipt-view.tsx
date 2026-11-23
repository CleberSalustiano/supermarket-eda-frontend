import type { CheckoutSaleReceipt } from '@supermarket/api-sdk';
import { InlineMessage } from '@supermarket/frontend-ui';

import { useI18n } from '../../../i18n';

const SALE_REF_LENGTH = 8;

interface ReceiptViewProps {
  receipt: CheckoutSaleReceipt;
  pendingSync: boolean;
}

export function ReceiptView({ receipt, pendingSync }: ReceiptViewProps) {
  const { m, fmt } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body-lg font-bold text-ink">{m.receipt.completedAt({ time: fmt.time(receipt.completedAt) })}</p>
      {pendingSync ? <InlineMessage tone="warning" title={m.receipt.pendingSync} /> : null}
      <ul className="flex flex-col border-t border-rule">
        {receipt.items.map((item) => (
          <li
            key={`${item.productId}-${item.barcode}`}
            className="flex items-baseline justify-between gap-4 border-b border-rule py-2 text-body tabular-nums"
          >
            <span className="min-w-0 text-ink">
              {item.quantity} × {item.name}
            </span>
            <span className="shrink-0 text-right text-ink">{fmt.currency(item.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-body-lg text-ink">{m.receipt.total}</span>
        <span className="font-display text-display-md tabular-nums text-ink">{fmt.currency(receipt.total)}</span>
      </div>
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-body tabular-nums">
        <dt className="text-ink-muted">{m.receipt.paid}</dt>
        <dd className="text-right text-ink">{fmt.currency(receipt.paidAmount)}</dd>
        <dt className="text-ink-muted">{m.receipt.change}</dt>
        <dd className="text-right text-ink">{fmt.currency(receipt.changeAmount)}</dd>
        <dt className="text-ink-muted">{m.receipt.method}</dt>
        <dd className="text-right text-ink">{m.payment.methods[receipt.paymentMethod]}</dd>
      </dl>
      <p className="text-small text-ink-muted tabular-nums">
        {m.receipt.saleRef({ id: receipt.saleId.slice(0, SALE_REF_LENGTH) })}
      </p>
    </div>
  );
}
