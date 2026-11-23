export const ptBR = {
  app: { name: 'Gestão' },
  tableRegion: (p: { title: string }) => `${p.title}: tabela com rolagem lateral`,
  nav: { products: 'Produtos', employees: 'Funcionários', results: 'Resultado' },
  products: {
    register: {
      title: 'Cadastrar produto',
      name: 'Nome do produto',
      barcode: 'Código de barras',
      unit: 'Unidade',
      price: 'Preço de venda',
      submit: 'Cadastrar produto',
      success: (p: { name: string }) => `Produto cadastrado: ${p.name}.`,
      firstPriceInfo: 'Para vender este produto no caixa, altere o preço uma vez.',
      error: 'Não foi possível cadastrar o produto.'
    },
    price: {
      title: 'Alterar preço',
      product: 'Produto',
      searchBarcode: 'Buscar pelo código de barras',
      search: 'Buscar',
      haveId: 'Tenho o ID do produto',
      productId: 'ID do produto',
      newPrice: 'Novo preço',
      submit: 'Alterar preço',
      success: (p: { name: string; old: string; new: string }) =>
        `Preço alterado: ${p.name}, de ${p.old} para ${p.new}.`,
      samePrice: 'O novo preço precisa ser diferente do atual.',
      notFound: 'Produto não encontrado na gestão.',
      lookupCurrent: (p: { amount: string }) => `Preço atual no caixa: ${p.amount}`,
      lookupNotFound: 'Nenhum produto com esse código no caixa. Escolha um recente ou informe o ID.',
      error: 'Não foi possível alterar o preço.'
    },
    recent: {
      title: 'Recentes neste navegador',
      empty: 'Os produtos que você cadastrar ou alterar aparecem aqui.',
      colProduct: 'Produto',
      colBarcode: 'Código de barras',
      colPrice: 'Preço',
      action: 'Alterar preço',
      actionAria: (p: { name: string }) => `Alterar preço de ${p.name}`
    }
  },
  employees: {
    title: 'Cadastrar funcionário',
    code: 'Código do funcionário',
    fullName: 'Nome completo',
    role: 'Função',
    roles: { ADMIN: 'Administrador', MANAGER: 'Gerente', CASHIER: 'Caixa' },
    submit: 'Cadastrar funcionário',
    success: (p: { name: string }) => `Funcionário cadastrado: ${p.name}.`,
    duplicate: (p: { code: string }) => `Já existe um funcionário com o código ${p.code}.`,
    error: 'Não foi possível cadastrar o funcionário.',
    copyId: 'Copiar ID',
    copyIdAria: (p: { name: string }) => `Copiar ID de ${p.name}`,
    copied: 'ID copiado',
    copyFallback: 'Copie o ID selecionado.',
    operatorHint: 'O ID do funcionário é usado como ID do operador ao abrir o caixa.',
    colName: 'Nome',
    colCode: 'Código',
    colRole: 'Função',
    colId: 'ID',
    list: {
      title: 'Funcionários cadastrados',
      code: 'Código',
      name: 'Nome',
      role: 'Função',
      status: 'Situação',
      active: 'Ativo',
      inactiveSince: (p: { date: string }) => `Inativo desde ${p.date}`,
      empty: 'Nenhum funcionário cadastrado.',
      error: 'Não foi possível carregar os funcionários.',
      actionError: 'Não foi possível concluir a ação.',
      retry: 'Tentar de novo',
      truncated: (p: { shown: number; total: number }) => `Mostrando ${p.shown} de ${p.total}.`
    },
    actions: { changePin: 'Trocar PIN', deactivate: 'Desativar' },
    deactivate: {
      title: 'Desativar funcionário',
      body: (p: { name: string; code: string }) =>
        `${p.name} (${p.code}) não poderá mais aprovar cancelamentos no caixa. Esta ação não pode ser desfeita aqui.`,
      confirm: 'Desativar',
      back: 'Voltar',
      done: (p: { name: string }) => `${p.name} foi desativado.`,
      alreadyInactive: 'Este funcionário já está inativo.'
    },
    pin: {
      label: 'PIN',
      hint: '4 a 12 dígitos',
      title: (p: { name: string }) => `Trocar o PIN de ${p.name}`,
      new: 'Novo PIN',
      confirm: 'Confirme o novo PIN',
      mismatch: 'Os dois PINs precisam ser iguais.',
      rejected: 'PIN não aceito. Use de 4 a 12 dígitos, diferente do PIN atual.',
      inactive: 'Funcionário inativo não pode trocar o PIN.',
      save: 'Salvar PIN',
      back: 'Voltar',
      done: (p: { name: string }) =>
        `PIN de ${p.name} alterado. Bloqueios por tentativas erradas deste código foram liberados.`
    }
  },
  results: {
    from: 'De',
    to: 'Até',
    submit: 'Gerar relatório',
    generating: 'Gerando…',
    heading: (p: { from: string; to: string }) => `Resultado de ${p.from} a ${p.to}`,
    revenue: 'Receita líquida',
    losses: '(−) Perdas de estoque',
    result: 'Resultado',
    counts: (p: { sales: number; items: number; lossEvents: number; lossItems: number }) =>
      `${p.sales} vendas, ${p.items} itens vendidos, ${p.lossEvents} registros de perda, ${p.lossItems} itens perdidos`,
    byDay: 'Por dia',
    colDate: 'Data',
    colRevenue: 'Receita líquida',
    colLosses: 'Perdas',
    colResult: 'Resultado',
    colSales: 'Vendas',
    empty: 'Nenhuma venda ou perda registrada nesse período.',
    error: 'Não foi possível gerar o relatório.'
  },
  validation: {
    name: 'Informe o nome com pelo menos 2 caracteres.',
    barcode: 'O código de barras precisa ter pelo menos 4 caracteres.',
    unit: 'Informe a unidade.',
    money: 'Informe um valor válido, por exemplo 22,90.',
    productId: 'O ID do produto precisa ser um UUID válido.',
    employeeCode: 'O código precisa ter de 2 a 32 caracteres.',
    fullName: 'Informe o nome completo com pelo menos 3 caracteres.',
    pin: 'O PIN precisa ter de 4 a 12 dígitos.',
    dateOrder: 'A data inicial não pode ser depois da final.'
  }
};

export type ManagementMessages = typeof ptBR;
