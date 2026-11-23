import { collectMessageKeys } from '@supermarket/frontend-i18n';
import { describe, expect, it } from 'vitest';

import { uiEn } from './en';
import { uiPtBR } from './pt-BR';

describe('ui catalogs', () => {
  it('have the same keys in pt-BR and en, with no empty strings', () => {
    expect(collectMessageKeys(uiEn)).toEqual(collectMessageKeys(uiPtBR));
  });
});
