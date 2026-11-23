export const ptBR = {
  app: { name: 'Caixa' },
  topBar: {
    register: ({ registerId }: { registerId: string }) => `Caixa ${registerId}`,
    operator: ({ id }: { id: string }) => `Operador ${id}`,
    closeRegister: 'Fechar caixa',
    moreActions: 'Mais ações'
  },
  open: {
    title: 'Abrir caixa',
    register: 'Caixa',
    operator: 'ID do operador',
    operatorHint: 'Copie o ID na gestão, em Funcionários.',
    float: 'Fundo de troco',
    submit: 'Abrir caixa',
    closedSummary: ({ id, time, amount }: { id: string; time: string; amount: string }) =>
      `Caixa ${id} fechado às ${time}. Dinheiro declarado ${amount}.`
  },
  scanner: {
    label: 'Código de barras',
    hint: 'Para várias unidades: 3*7891234567890',
    disabledPlaceholder: 'Pressione F2 para iniciar uma venda',
    formatError: 'Use o formato quantidade*código, por exemplo 3*7891234567890.',
    priceCheck: 'Consultar preço',
    notFound: ({ code }: { code: string }) =>
      `Produto não encontrado: ${code}. Confira o código ou cadastre o produto na gestão.`,
    announceAdded: ({ name, count }: { name: string; count: number }) =>
      count === 1
        ? `Item registrado: ${name}, 1 unidade.`
        : `Item registrado: ${name}, ${count} unidades.`
  },
  items: {
    remove: 'Remover 1',
    removeAria: ({ name }: { name: string }) => `Remover 1 unidade de ${name}`,
    count: ({ count }: { count: number }) => (count === 1 ? '1 item' : `${count} itens`)
  },
  total: { label: 'Total da venda' },
  next: {
    noSale: 'Nenhuma venda em andamento.',
    newSale: 'Nova venda',
    emptyCart: 'Registre o primeiro item pelo código de barras.'
  },
  payment: {
    title: 'Pagamento',
    method: 'Forma de pagamento',
    methods: {
      CASH: 'Dinheiro',
      CREDIT_CARD: 'Crédito',
      DEBIT_CARD: 'Débito',
      PIX: 'Pix',
      VOUCHER: 'Vale'
    },
    received: 'Valor recebido',
    exact: 'Valor exato',
    change: 'Troco',
    short: ({ amount }: { amount: string }) => `Faltam ${amount}`,
    submit: 'Receber pagamento'
  },
  paid: { title: 'Pagamento recebido', complete: 'Concluir venda' },
  receipt: {
    completedAt: ({ time }: { time: string }) => `Venda concluída às ${time}.`,
    saleRef: ({ id }: { id: string }) => `Venda ${id}`,
    total: 'Total',
    paid: 'Pago',
    change: 'Troco',
    method: 'Forma de pagamento',
    pendingSync:
      'Venda salva. A sincronização com a gestão está pendente e será refeita automaticamente.'
  },
  canceled: {
    summary: ({ reason }: { reason: string }) => `Venda cancelada. Motivo: ${reason}.`,
    approvedBy: ({ name, code }: { name: string; code: string }) => `Aprovado por ${name} (${code}).`
  },
  cancel: {
    open: 'Cancelar venda',
    title: 'Cancelar venda',
    body: 'Esta ação não pode ser desfeita.',
    reason: 'Motivo do cancelamento',
    managerCode: 'Código do gerente',
    managerPin: 'PIN do gerente',
    managerHint: 'Vendas pagas ou concluídas precisam do código e do PIN de um gerente.',
    managerCodeRequired: 'Informe o código do gerente.',
    managerPinInvalid: 'O PIN tem de 4 a 12 dígitos.',
    approvalRejected: 'Código do gerente ou PIN inválido.',
    approvalLocked: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
    approvalUnavailable: 'Gestão indisponível, tente novamente. A venda não foi cancelada.',
    back: 'Voltar',
    confirm: 'Confirmar cancelamento'
  },
  close: {
    title: 'Fechar caixa',
    counted: 'Dinheiro contado na gaveta',
    blocked: 'Conclua ou cancele a venda em andamento antes de fechar o caixa.',
    back: 'Voltar',
    confirm: 'Fechar caixa'
  },
  errors: {
    open: 'Não foi possível abrir o caixa.',
    start: 'Não foi possível iniciar a venda.',
    lookup: 'Não foi possível consultar o preço.',
    add: 'Não foi possível registrar o item.',
    remove: 'Não foi possível remover o item.',
    payment: 'Pagamento não aceito.',
    complete: 'Não foi possível concluir a venda.',
    cancel: 'Não foi possível cancelar a venda.',
    close: 'Não foi possível fechar o caixa.'
  },
  validation: {
    money: 'Informe um valor válido, por exemplo 22,90.',
    positive: 'O valor precisa ser maior que zero.',
    reason: 'Informe o motivo com pelo menos 4 caracteres.',
    operatorId: 'O ID do operador precisa ser um UUID válido.',
    registerId: 'Informe o caixa com 2 a 32 caracteres.'
  },
  devTools: {
    tenantLocked: 'Feche o caixa para trocar a loja.'
  }
};

export type CheckoutMessages = typeof ptBR;
