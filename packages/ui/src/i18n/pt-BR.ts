export const uiPtBR = {
  skipLink: 'Ir para o conteúdo',
  connection: {
    banner: (p: { service: string }) => `Sem conexão com ${p.service}. Tentando de novo a cada 15 segundos.`,
    retry: 'Tentar agora',
    service: {
      checkout: 'o servidor do caixa',
      management: 'o servidor da gestão',
      inventory: 'o servidor do estoque'
    }
  },
  config: {
    title: 'Configuração incompleta',
    body: 'Defina estas variáveis no build e publique de novo:'
  },
  message: {
    serverDetail: (p: { message: string }) => `Detalhe do servidor: ${p.message}`,
    supportCode: (p: { id: string }) => `Código para suporte: ${p.id}`,
    network: 'Sem conexão com o servidor. Verifique a rede e tente de novo.'
  },
  prefs: {
    button: 'Preferências',
    theme: 'Tema',
    themeSystem: 'Sistema',
    themeLight: 'Claro',
    themeDark: 'Escuro',
    language: 'Idioma'
  },
  laneLight: {
    open: 'Aberto',
    closed: 'Fechado'
  },
  dialog: {
    close: 'Fechar'
  },
  priceTag: {
    aria: (p: { label: string; amount: string }) => `${p.label}: ${p.amount}`
  }
};

export type UiMessages = typeof uiPtBR;
