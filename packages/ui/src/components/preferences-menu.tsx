import { supportedLocales, useLocale, type Locale } from '@supermarket/frontend-i18n';
import { SlidersHorizontal } from 'lucide-react';

import { useUiMessages } from '../i18n/ui-i18n';
import { useTheme, type ThemePreference } from '../theme/theme-provider';
import { Popover } from './popover';
import { SegmentedControl } from './segmented-control';

// Language names are always shown in their own language.
const languageNames: Record<Locale, string> = { 'pt-BR': 'Português (Brasil)', en: 'English' };

export function PreferencesMenu() {
  const m = useUiMessages();
  const { preference, setPreference } = useTheme();
  const { locale, setLocale } = useLocale();

  const themeOptions: ReadonlyArray<{ value: ThemePreference; label: string }> = [
    { value: 'system', label: m.prefs.themeSystem },
    { value: 'light', label: m.prefs.themeLight },
    { value: 'dark', label: m.prefs.themeDark }
  ];
  const languageOptions = supportedLocales.map((value) => ({ value, label: languageNames[value] }));

  return (
    <Popover triggerLabel={m.prefs.button} triggerIcon={<SlidersHorizontal aria-hidden="true" size={20} />}>
      <div className="flex flex-col gap-4">
        <p className="text-heading text-ink">{m.prefs.button}</p>
        <SegmentedControl label={m.prefs.theme} options={themeOptions} value={preference} onChange={setPreference} />
        <SegmentedControl label={m.prefs.language} options={languageOptions} value={locale} onChange={setLocale} />
      </div>
    </Popover>
  );
}
