import { createI18n } from '@supermarket/frontend-i18n';

import { en } from './en';
import { ptBR, type CheckoutMessages } from './pt-BR';

export const { I18nProvider, useI18n } = createI18n<CheckoutMessages>();

export const catalogs = { 'pt-BR': ptBR, en } as const;

export type { CheckoutMessages };
