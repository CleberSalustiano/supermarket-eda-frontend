import { createI18n } from '@supermarket/frontend-i18n';

import { en } from './en';
import { ptBR, type ManagementMessages } from './pt-BR';

export const { I18nProvider, useI18n } = createI18n<ManagementMessages>();

export const catalogs = { 'pt-BR': ptBR, en };
export type { ManagementMessages };
