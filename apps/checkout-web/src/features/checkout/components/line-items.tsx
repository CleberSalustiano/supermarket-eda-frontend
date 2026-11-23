import type { CheckoutSale } from '@supermarket/api-sdk';
import { Button, cn } from '@supermarket/frontend-ui';

import { useI18n } from '../../../i18n';

interface LineItemsProps {
  sale: CheckoutSale;
  lastAddedBarcode: string | null;
  canRemove: boolean;
  onRemove: (barcode: string) => void;
}

export function LineItems({ sale, lastAddedBarcode, canRemove, onRemove }: LineItemsProps) {
  const { m, fmt } = useI18n();

  return (
    <ul className="flex flex-col">
      {sale.items.map((item) => (
        <li
          key={`${item.productId}-${item.barcode}`}
          className={cn(
            'flex items-center justify-between gap-4 border-b border-rule py-3',
            item.barcode === lastAddedBarcode && 'animate-just-added'
          )}
        >
          <div className="min-w-0">
            <p className="text-body-lg text-ink">{item.name}</p>
            <p className="text-small tabular-nums text-ink-muted">{item.barcode}</p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <div className="text-right tabular-nums">
              <p className="text-small text-ink-muted">
                {item.quantity} × {fmt.currency(item.unitPrice)}
              </p>
              <p className="text-body-lg font-bold text-ink">{fmt.currency(item.lineTotal)}</p>
            </div>
            <Button
              variant="quiet"
              disabled={!canRemove}
              aria-label={m.items.removeAria({ name: item.name })}
              onClick={() => {
                onRemove(item.barcode);
              }}
            >
              {m.items.remove}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
