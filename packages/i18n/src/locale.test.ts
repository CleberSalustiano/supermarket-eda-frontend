import { afterEach, vi } from 'vitest';

import { intlLocale, isLocale, readStoredLocale, supportedLocales, writeStoredLocale } from './locale';

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('locale', () => {
  it('lists the supported locales and guards values', () => {
    expect(supportedLocales).toEqual(['pt-BR', 'en']);
    expect(isLocale('pt-BR')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale(null)).toBe(false);
  });

  it('maps to Intl locales', () => {
    expect(intlLocale('pt-BR')).toBe('pt-BR');
    expect(intlLocale('en')).toBe('en-US');
  });

  it('round-trips through storage', () => {
    expect(readStoredLocale()).toBeNull();
    writeStoredLocale('en');
    expect(window.localStorage.getItem('supermarket.locale')).toBe('en');
    expect(readStoredLocale()).toBe('en');
  });

  it('ignores an invalid stored value', () => {
    window.localStorage.setItem('supermarket.locale', 'fr');
    expect(readStoredLocale()).toBeNull();
  });

  it('survives storage failures', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(readStoredLocale()).toBeNull();
    expect(() => writeStoredLocale('en')).not.toThrow();
  });
});
