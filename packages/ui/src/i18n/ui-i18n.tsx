import { createLocaleFormat, LocaleContext, type Locale, type LocaleFormat } from '@supermarket/frontend-i18n';
import { useContext, useMemo, type ReactNode } from 'react';

import { uiEn } from './en';
import { uiPtBR, type UiMessages } from './pt-BR';

const catalogs: Record<Locale, UiMessages> = { 'pt-BR': uiPtBR, en: uiEn };

const FALLBACK_LOCALE: Locale = 'pt-BR';

export type UiI18n = { locale: Locale; m: UiMessages; fmt: LocaleFormat };

/** Provides only the locale. Apps normally get it from their own I18nProvider; this is for standalone use and tests. */
export function UiI18nProvider({
  locale,
  setLocale = () => undefined,
  children
}: {
  locale: Locale;
  setLocale?: (locale: Locale) => void;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Falls back to pt-BR when no locale provider exists (for example the configuration error screen). */
export function useUiI18n(): UiI18n {
  const state = useContext(LocaleContext);
  const locale = state?.locale ?? FALLBACK_LOCALE;
  const fmt = useMemo(() => createLocaleFormat(locale), [locale]);
  return { locale, m: catalogs[locale], fmt };
}

export function useUiMessages(): UiMessages {
  return useUiI18n().m;
}

export { catalogs as uiCatalogs };
