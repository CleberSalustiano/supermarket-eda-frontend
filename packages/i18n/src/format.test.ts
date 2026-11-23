import { createLocaleFormat } from './format';

describe('createLocaleFormat pt-BR', () => {
  const fmt = createLocaleFormat('pt-BR');

  it('formats currency', () => {
    expect(fmt.currency(1234.56)).toMatch(/^R\$\s1\.234,56$/);
  });

  it('splits currency', () => {
    expect(fmt.splitCurrency(1234.56)).toEqual({ symbol: 'R$', integer: '1.234', decimalSeparator: ',', cents: '56' });
  });

  it('formats a local date without timezone shift', () => {
    expect(fmt.date('2026-11-22')).toBe('22/11/2026');
  });

  it('formats date-time and time', () => {
    const iso = new Date(2026, 10, 22, 14, 3).toISOString();
    expect(fmt.dateTime(iso)).toBe('22/11/2026 14:03');
    expect(fmt.time(iso)).toBe('14:03');
  });

  it('parses decimals with comma or dot', () => {
    expect(fmt.parseDecimal('22,90')).toBe(22.9);
    expect(fmt.parseDecimal('22.9')).toBe(22.9);
    expect(fmt.parseDecimal('1.234,56')).toBeNull();
    expect(fmt.parseDecimal('22,999')).toBeNull();
    expect(fmt.parseDecimal('abc')).toBeNull();
    expect(fmt.parseDecimal('')).toBeNull();
    expect(fmt.decimalPattern.test('7,5')).toBe(true);
  });

  it('pluralizes', () => {
    const forms = { one: '1 item', other: 'itens' };
    expect(fmt.plural(1, forms)).toBe('1 item');
    expect(fmt.plural(3, forms)).toBe('itens');
  });
});

describe('createLocaleFormat en', () => {
  const fmt = createLocaleFormat('en');

  it('formats currency', () => {
    expect(fmt.currency(1234.56)).toBe('R$1,234.56');
  });

  it('splits currency', () => {
    expect(fmt.splitCurrency(1234.56)).toEqual({ symbol: 'R$', integer: '1,234', decimalSeparator: '.', cents: '56' });
  });

  it('formats a local date', () => {
    expect(fmt.date('2026-11-22')).toBe('11/22/2026');
  });

  it('formats date-time', () => {
    const iso = new Date(2026, 10, 22, 14, 3).toISOString();
    expect(fmt.dateTime(iso)).toMatch(/^11\/22\/2026, 0?2:03\s?PM$/);
  });

  it('accepts only a dot as decimal separator', () => {
    expect(fmt.parseDecimal('22,90')).toBeNull();
    expect(fmt.parseDecimal('22.90')).toBe(22.9);
    expect(fmt.parseDecimal('1.234,56')).toBeNull();
  });

  it('pluralizes', () => {
    expect(fmt.plural(1, { one: 'item', other: 'items' })).toBe('item');
    expect(fmt.plural(0, { one: 'item', other: 'items' })).toBe('items');
  });
});
