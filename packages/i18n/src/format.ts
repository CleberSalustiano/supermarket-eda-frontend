import { intlLocale, type Locale } from './locale';

export type CurrencyParts = {
  symbol: string;
  integer: string;
  decimalSeparator: string;
  cents: string;
};

export type PluralForms = { one: string; other: string };

export type LocaleFormat = {
  currency: (value: number) => string;
  splitCurrency: (value: number) => CurrencyParts;
  dateTime: (iso: string) => string;
  time: (iso: string) => string;
  date: (ymd: string) => string;
  decimalPattern: RegExp;
  parseDecimal: (text: string) => number | null;
  plural: (count: number, forms: PluralForms) => string;
};

const DECIMAL_PATTERNS: Record<Locale, RegExp> = {
  'pt-BR': /^\d+(?:[.,]\d{1,2})?$/,
  en: /^\d+(?:\.\d{1,2})?$/
};

const YMD_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function createLocaleFormat(locale: Locale): LocaleFormat {
  const intl = intlLocale(locale);
  const currencyFormat = new Intl.NumberFormat(intl, { style: 'currency', currency: 'BRL' });
  const dateFormat = new Intl.DateTimeFormat(intl, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeFormat = new Intl.DateTimeFormat(intl, { hour: '2-digit', minute: '2-digit' });
  const pluralRules = new Intl.PluralRules(intl);
  const decimalPattern = DECIMAL_PATTERNS[locale];

  const date = (ymd: string): string => {
    const match = YMD_PATTERN.exec(ymd);
    if (!match) {
      return ymd;
    }
    const [, year, month, day] = match;
    return dateFormat.format(new Date(Number(year), Number(month) - 1, Number(day)));
  };

  const time = (iso: string): string => timeFormat.format(new Date(iso));

  return {
    currency: (value) => currencyFormat.format(value),
    splitCurrency: (value) => {
      const parts = currencyFormat.formatToParts(value);
      const join = (types: string[]) =>
        parts
          .filter((part) => types.includes(part.type))
          .map((part) => part.value)
          .join('');
      const integer = parts
        .filter((part) => part.type === 'integer' || part.type === 'group')
        .map((part) => part.value)
        .join('');
      return {
        symbol: join(['currency']),
        integer,
        decimalSeparator: join(['decimal']),
        cents: join(['fraction'])
      };
    },
    dateTime: (iso) => `${dateFormat.format(new Date(iso))}${locale === 'pt-BR' ? ' ' : ', '}${time(iso)}`,
    time,
    date,
    decimalPattern,
    parseDecimal: (text) => {
      const trimmed = text.trim();
      if (!decimalPattern.test(trimmed)) {
        return null;
      }
      return Number(trimmed.replace(',', '.'));
    },
    plural: (count, forms) => (pluralRules.select(count) === 'one' ? forms.one : forms.other)
  };
}
