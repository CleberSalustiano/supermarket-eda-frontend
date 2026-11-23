import { cn } from '../cn';
import { useUiI18n } from '../i18n/ui-i18n';

export type PriceTagSize = 'xl' | 'lg' | 'md';

const integerClasses: Record<PriceTagSize, string> = {
  xl: 'font-display text-display-lg sm:text-display-xl',
  lg: 'font-display text-display-lg',
  md: 'font-display text-display-md'
};

const centsClasses: Record<PriceTagSize, string> = {
  xl: 'font-display text-display-lg sm:text-display-md',
  lg: 'font-display text-title',
  md: 'font-display text-heading'
};

export interface PriceTagProps {
  value: number;
  size: PriceTagSize;
  label: string;
}

export function PriceTag({ value, size, label }: PriceTagProps) {
  const { m, fmt } = useUiI18n();
  const parts = fmt.splitCurrency(value);
  return (
    <div
      role="img"
      aria-label={m.priceTag.aria({ label, amount: fmt.currency(value) })}
      className="inline-flex items-start gap-2 rounded-tag bg-tag px-6 py-4 tabular-nums text-on-tag"
    >
      <span aria-hidden="true" className="text-heading">
        {parts.symbol}
      </span>
      <span aria-hidden="true" className={cn('inline-flex items-start', integerClasses[size])}>
        {parts.integer}
        <span className={cn('inline-flex items-start', centsClasses[size])}>
          {parts.decimalSeparator}
          {parts.cents}
        </span>
      </span>
    </div>
  );
}
