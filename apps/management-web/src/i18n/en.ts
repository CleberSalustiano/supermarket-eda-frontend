import type { ManagementMessages } from './pt-BR';

export const en: ManagementMessages = {
  app: { name: 'Management' },
  tableRegion: (p) => `${p.title}: table with sideways scrolling`,
  nav: { products: 'Products', employees: 'Employees', results: 'Results' },
  products: {
    register: {
      title: 'Register product',
      name: 'Product name',
      barcode: 'Barcode',
      unit: 'Unit',
      price: 'Selling price',
      submit: 'Register product',
      success: (p) => `Product registered: ${p.name}.`,
      firstPriceInfo: 'To sell this product at the checkout, change its price once.',
      error: "Couldn't register the product."
    },
    price: {
      title: 'Change price',
      product: 'Product',
      searchBarcode: 'Find by barcode',
      search: 'Find',
      haveId: 'I have the product ID',
      productId: 'Product ID',
      newPrice: 'New price',
      submit: 'Change price',
      success: (p) => `Price changed: ${p.name}, from ${p.old} to ${p.new}.`,
      samePrice: 'The new price must differ from the current one.',
      notFound: 'Product not found in Management.',
      lookupCurrent: (p) => `Current checkout price: ${p.amount}`,
      lookupNotFound: 'No product with this code at the checkout. Pick a recent one or enter the ID.',
      error: "Couldn't change the price."
    },
    recent: {
      title: 'Recent in this browser',
      empty: 'Products you register or update appear here.',
      colProduct: 'Product',
      colBarcode: 'Barcode',
      colPrice: 'Price',
      action: 'Change price',
      actionAria: (p: { name: string }) => `Change price of ${p.name}`
    }
  },
  employees: {
    title: 'Register employee',
    code: 'Employee code',
    fullName: 'Full name',
    role: 'Role',
    roles: { ADMIN: 'Administrator', MANAGER: 'Manager', CASHIER: 'Cashier' },
    submit: 'Register employee',
    success: (p) => `Employee registered: ${p.name}.`,
    duplicate: (p) => `An employee with code ${p.code} already exists.`,
    error: "Couldn't register the employee.",
    copyId: 'Copy ID',
    copyIdAria: (p: { name: string }) => `Copy ID of ${p.name}`,
    copied: 'ID copied',
    copyFallback: 'Copy the selected ID.',
    operatorHint: 'The employee ID is used as the operator ID when opening the register.',
    colName: 'Name',
    colCode: 'Code',
    colRole: 'Role',
    colId: 'ID',
    list: {
      title: 'Registered employees',
      code: 'Code',
      name: 'Name',
      role: 'Role',
      status: 'Status',
      active: 'Active',
      inactiveSince: (p) => `Inactive since ${p.date}`,
      empty: 'No employees registered.',
      error: 'Could not load employees.',
      actionError: 'Could not complete the action.',
      retry: 'Try again',
      truncated: (p) => `Showing ${p.shown} of ${p.total}.`
    },
    actions: { changePin: 'Change PIN', deactivate: 'Deactivate' },
    deactivate: {
      title: 'Deactivate employee',
      body: (p) =>
        `${p.name} (${p.code}) will no longer be able to approve cancellations at the checkout. This cannot be undone here.`,
      confirm: 'Deactivate',
      back: 'Back',
      done: (p) => `${p.name} was deactivated.`,
      alreadyInactive: 'This employee is already inactive.'
    },
    pin: {
      label: 'PIN',
      hint: '4 to 12 digits',
      title: (p) => `Change ${p.name}'s PIN`,
      new: 'New PIN',
      confirm: 'Confirm the new PIN',
      mismatch: 'The two PINs must match.',
      rejected: 'PIN not accepted. Use 4 to 12 digits, different from the current PIN.',
      inactive: 'An inactive employee cannot change the PIN.',
      save: 'Save PIN',
      back: 'Back',
      done: (p) => `${p.name}'s PIN was changed. Lockouts for wrong attempts with this code were cleared.`
    }
  },
  results: {
    from: 'From',
    to: 'To',
    submit: 'Generate report',
    generating: 'Generating…',
    heading: (p) => `Results from ${p.from} to ${p.to}`,
    revenue: 'Net revenue',
    losses: '(−) Inventory losses',
    result: 'Result',
    counts: (p) =>
      `${p.sales} sales, ${p.items} items sold, ${p.lossEvents} loss records, ${p.lossItems} items lost`,
    byDay: 'By day',
    colDate: 'Date',
    colRevenue: 'Net revenue',
    colLosses: 'Losses',
    colResult: 'Result',
    colSales: 'Sales',
    empty: 'No sales or losses in this period.',
    error: "Couldn't generate the report."
  },
  validation: {
    name: 'Enter a name with at least 2 characters.',
    barcode: 'The barcode must have at least 4 characters.',
    unit: 'Enter the unit.',
    money: 'Enter a valid amount, for example 22.90.',
    productId: 'The product ID must be a valid UUID.',
    employeeCode: 'The code must have 2 to 32 characters.',
    fullName: 'Enter the full name with at least 3 characters.',
    pin: 'The PIN must have 4 to 12 digits.',
    dateOrder: "The start date can't be after the end date."
  }
};
