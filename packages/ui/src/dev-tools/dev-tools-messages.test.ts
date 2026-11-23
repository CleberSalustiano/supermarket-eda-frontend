import { collectMessageKeys } from '@supermarket/frontend-i18n';
import { describe, expect, it } from 'vitest';

import { devToolsCatalogs } from './dev-tools-messages';

describe('dev tools catalogs', () => {
  it('have the same keys in pt-BR and en, with no empty strings', () => {
    expect(devToolsCatalogs).not.toBeNull();
    expect(collectMessageKeys(devToolsCatalogs!.en)).toEqual(collectMessageKeys(devToolsCatalogs!['pt-BR']));
  });
});
