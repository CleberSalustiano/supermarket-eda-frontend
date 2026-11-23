import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { createLocaleFormat, type LocaleFormat } from './format';
import { readStoredLocale, writeStoredLocale, type Locale } from './locale';

export type LocaleState = { locale: Locale; setLocale: (locale: Locale) => void };

export const LocaleContext = createContext<LocaleState | null>(null);

export function useLocale(): LocaleState {
  const state = useContext(LocaleContext);
  if (!state) {
    throw new Error('useLocale must be used inside an I18nProvider');
  }
  return state;
}

export type I18nProviderProps<M> = {
  catalogs: Record<Locale, M>;
  defaultLocale: Locale;
  children: ReactNode;
};

export type I18nValue<M> = LocaleState & { m: M; fmt: LocaleFormat };

export function createI18n<M>() {
  function I18nProvider({ catalogs, defaultLocale, children }: I18nProviderProps<M>) {
    const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale() ?? defaultLocale);

    useEffect(() => {
      document.documentElement.lang = locale;
    }, [locale]);

    const setLocale = useCallback((next: Locale) => {
      writeStoredLocale(next);
      setLocaleState(next);
    }, []);

    const state = useMemo<LocaleState>(() => ({ locale, setLocale }), [locale, setLocale]);
    const value = useMemo<I18nValue<M>>(
      () => ({ ...state, m: catalogs[locale], fmt: createLocaleFormat(locale) }),
      [state, catalogs, locale]
    );

    return (
      <LocaleContext.Provider value={state}>
        <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
      </LocaleContext.Provider>
    );
  }

  const CatalogContext = createContext<I18nValue<M> | null>(null);

  function useI18n(): I18nValue<M> {
    const value = useContext(CatalogContext);
    if (!value) {
      throw new Error('useI18n must be used inside an I18nProvider');
    }
    return value;
  }

  return { I18nProvider, useI18n };
}
