import type { LocaleFormat } from '@supermarket/frontend-i18n';

/** Formats a number as editable decimal text (no currency symbol), with the locale's decimal separator. */
export function formatDecimalInput(value: number, fmt: LocaleFormat): string {
  return value.toFixed(2).replace('.', fmt.splitCurrency(0).decimalSeparator);
}
