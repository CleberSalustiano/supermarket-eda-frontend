import { developmentDefaults, resolveFrontendRuntimeConfig } from '@supermarket/frontend-config';
import { renderWithProviders } from '@supermarket/frontend-ui/test';
import type { Locale } from '@supermarket/frontend-i18n';

import { CheckoutRoutes } from '../App';
import { catalogs, I18nProvider } from '../i18n';

const result = resolveFrontendRuntimeConfig({ MODE: 'test' }, ['checkout'], developmentDefaults);

if (!result.ok) {
  throw new Error('Test runtime configuration must resolve');
}

export const testConfig = result.config;

export function renderApp({ locale = 'pt-BR' }: { locale?: Locale } = {}) {
  return renderWithProviders(
    <I18nProvider catalogs={catalogs} defaultLocale={locale}>
      <CheckoutRoutes config={testConfig} />
    </I18nProvider>,
    { locale }
  );
}
