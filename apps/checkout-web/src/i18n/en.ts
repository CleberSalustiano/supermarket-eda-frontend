import type { CheckoutMessages } from './pt-BR';

export const en: CheckoutMessages = {
  app: { name: 'Checkout' },
  topBar: {
    register: ({ registerId }) => `Register ${registerId}`,
    operator: ({ id }) => `Operator ${id}`,
    closeRegister: 'Close register',
    moreActions: 'More actions'
  },
  open: {
    title: 'Open register',
    register: 'Register',
    operator: 'Operator ID',
    operatorHint: 'Copy the ID from Management, under Employees.',
    float: 'Opening float',
    submit: 'Open register',
    closedSummary: ({ id, time, amount }) =>
      `Register ${id} closed at ${time}. Declared cash ${amount}.`
  },
  scanner: {
    label: 'Barcode',
    hint: 'For several units: 3*7891234567890',
    disabledPlaceholder: 'Press F2 to start a sale',
    formatError: 'Use quantity*code, for example 3*7891234567890.',
    priceCheck: 'Check price',
    notFound: ({ code }) =>
      `Product not found: ${code}. Check the code or register the product in Management.`,
    announceAdded: ({ name, count }) =>
      count === 1 ? `Item added: ${name}, 1 unit.` : `Item added: ${name}, ${count} units.`
  },
  items: {
    remove: 'Remove 1',
    removeAria: ({ name }) => `Remove 1 unit of ${name}`,
    count: ({ count }) => (count === 1 ? '1 item' : `${count} items`)
  },
  total: { label: 'Sale total' },
  next: {
    noSale: 'No sale in progress.',
    newSale: 'New sale',
    emptyCart: 'Scan the first item.'
  },
  payment: {
    title: 'Payment',
    method: 'Payment method',
    methods: {
      CASH: 'Cash',
      CREDIT_CARD: 'Credit',
      DEBIT_CARD: 'Debit',
      PIX: 'Pix',
      VOUCHER: 'Voucher'
    },
    received: 'Amount received',
    exact: 'Exact amount',
    change: 'Change',
    short: ({ amount }) => `${amount} short`,
    submit: 'Take payment'
  },
  paid: { title: 'Payment received', complete: 'Complete sale' },
  receipt: {
    completedAt: ({ time }) => `Sale completed at ${time}.`,
    saleRef: ({ id }) => `Sale ${id}`,
    total: 'Total',
    paid: 'Paid',
    change: 'Change',
    method: 'Payment method',
    pendingSync: 'Sale saved. Sync with Management is pending and will retry automatically.'
  },
  canceled: {
    summary: ({ reason }) => `Sale canceled. Reason: ${reason}.`,
    approvedBy: ({ name, code }) => `Approved by ${name} (${code}).`
  },
  cancel: {
    open: 'Cancel sale',
    title: 'Cancel sale',
    body: 'This cannot be undone.',
    reason: 'Cancellation reason',
    managerCode: 'Manager code',
    managerPin: 'Manager PIN',
    managerHint: "Paid or completed sales need a manager's code and PIN.",
    managerCodeRequired: 'Enter the manager code.',
    managerPinInvalid: 'The PIN has 4 to 12 digits.',
    approvalRejected: 'Invalid manager code or PIN.',
    approvalLocked: 'Too many attempts. Wait a few minutes and try again.',
    approvalUnavailable: 'Management is unavailable, try again. The sale was not canceled.',
    back: 'Back',
    confirm: 'Confirm cancellation'
  },
  close: {
    title: 'Close register',
    counted: 'Cash counted in drawer',
    blocked: 'Complete or cancel the current sale before closing the register.',
    back: 'Back',
    confirm: 'Close register'
  },
  errors: {
    open: "Couldn't open the register.",
    start: "Couldn't start the sale.",
    lookup: "Couldn't check the price.",
    add: "Couldn't add the item.",
    remove: "Couldn't remove the item.",
    payment: 'Payment not accepted.',
    complete: "Couldn't complete the sale.",
    cancel: "Couldn't cancel the sale.",
    close: "Couldn't close the register."
  },
  validation: {
    money: 'Enter a valid amount, for example 22.90.',
    positive: 'The amount must be greater than zero.',
    reason: 'Enter a reason with at least 4 characters.',
    operatorId: 'The operator ID must be a valid UUID.',
    registerId: 'Enter a register ID with 2 to 32 characters.'
  },
  devTools: {
    tenantLocked: 'Close the register to change the store.'
  }
};
