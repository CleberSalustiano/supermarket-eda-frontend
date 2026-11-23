import { describe, expect, it } from 'vitest';

import { parseScanInput } from './scan-input';

describe('parseScanInput', () => {
  it('reads a bare barcode as quantity 1', () => {
    expect(parseScanInput('7891234567890')).toEqual({
      ok: true,
      barcode: '7891234567890',
      quantity: 1
    });
  });

  it('reads quantity*barcode', () => {
    expect(parseScanInput(' 3*7891234567890 ')).toEqual({
      ok: true,
      barcode: '7891234567890',
      quantity: 3
    });
  });

  it('accepts the quantity bounds 1 and 999', () => {
    expect(parseScanInput('1*789')).toMatchObject({ ok: true, quantity: 1 });
    expect(parseScanInput('999*789')).toMatchObject({ ok: true, quantity: 999 });
  });

  it.each(['0*789', '1000*789', '1.5*789', '-2*789', 'a*789', '*789', '3*', '3*4*789', '', '   '])(
    'rejects %j with the format error',
    (text) => {
      expect(parseScanInput(text)).toEqual({ ok: false, error: 'scanner.formatError' });
    }
  );
});
