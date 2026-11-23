import { LocaleContext, type Locale } from '@supermarket/frontend-i18n';
import { useContext } from 'react';

export type DevToolsMessages = {
  title: string;
  tenant: string;
  urls: string;
  clear: string;
};

const emptyMessages: DevToolsMessages = { title: '', tenant: '', urls: '', clear: '' };

// The static guard lets the bundler drop these strings from production builds; the panel
// is never rendered there (`devToolsEnabled` is always false in production).
export const devToolsCatalogs: Record<Locale, DevToolsMessages> | null =
  import.meta.env.MODE === 'production'
    ? null
    : {
        'pt-BR': {
          title: 'Ferramentas de desenvolvimento',
          tenant: 'Loja (tenant)',
          urls: 'Endereços dos serviços',
          clear: 'Limpar dados locais deste app'
        },
        en: {
          title: 'Developer tools',
          tenant: 'Store (tenant)',
          urls: 'Service URLs',
          clear: "Clear this app's local data"
        }
      };

export function useDevToolsMessages(): DevToolsMessages {
  const locale = useContext(LocaleContext)?.locale ?? 'pt-BR';
  return devToolsCatalogs?.[locale] ?? emptyMessages;
}
