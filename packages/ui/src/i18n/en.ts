import type { UiMessages } from './pt-BR';

export const uiEn: UiMessages = {
  skipLink: 'Skip to content',
  connection: {
    banner: (p) => `Can't reach ${p.service}. Retrying every 15 seconds.`,
    retry: 'Retry now',
    service: {
      checkout: 'the checkout server',
      management: 'the management server',
      inventory: 'the inventory server'
    }
  },
  config: {
    title: 'Incomplete configuration',
    body: 'Set these variables at build time and deploy again:'
  },
  message: {
    serverDetail: (p) => `Server detail: ${p.message}`,
    supportCode: (p) => `Support code: ${p.id}`,
    network: "Can't reach the server. Check the network and try again."
  },
  prefs: {
    button: 'Preferences',
    theme: 'Theme',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    language: 'Language'
  },
  laneLight: {
    open: 'Open',
    closed: 'Closed'
  },
  dialog: {
    close: 'Close'
  },
  priceTag: {
    aria: (p) => `${p.label}: ${p.amount}`
  }
};
