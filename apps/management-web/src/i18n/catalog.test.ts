import { collectMessageKeys } from '@supermarket/frontend-i18n';
import { describe, expect, it } from 'vitest';

import { en } from './en';
import { ptBR } from './pt-BR';

describe('management catalogs', () => {
  it('have the same keys in pt-BR and en, with no empty messages', () => {
    expect(collectMessageKeys(en)).toEqual(collectMessageKeys(ptBR));
  });
});
