export type Locale = 'pt-BR' | 'en';

export const supportedLocales: readonly Locale[] = ['pt-BR', 'en'];

export const LOCALE_STORAGE_KEY = 'supermarket.locale';

export function isLocale(value: unknown): value is Locale {
  return value === 'pt-BR' || value === 'en';
}

export function intlLocale(locale: Locale): string {
  return locale === 'pt-BR' ? 'pt-BR' : 'en-US';
}

export function readStoredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function writeStoredLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Storage can be unavailable (private mode, disabled); the preference is then session-only.
  }
}
