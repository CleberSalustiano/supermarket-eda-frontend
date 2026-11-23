import { collectMessageKeys } from '@supermarket/frontend-i18n';
import { describe, expect, it } from 'vitest';

import { en } from './en';
import { ptBR } from './pt-BR';

describe('Inventory catalogs', () => {
  it('keeps pt-BR and en keys equal and non-empty', () => {
    expect(collectMessageKeys(en)).toEqual(collectMessageKeys(ptBR));
  });
});
