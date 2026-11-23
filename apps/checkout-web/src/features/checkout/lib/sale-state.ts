import type {
  CheckoutEventPublicationStatus,
  CheckoutPosSession,
  CheckoutSale,
  CheckoutSaleReceipt,
  CheckoutSaleStatus
} from '@supermarket/api-sdk';

export interface CheckoutCapabilities {
  hasOpenSession: boolean;
  hasMutableSale: boolean;
  canStartSale: boolean;
  canProcessPayment: boolean;
  canCompleteSale: boolean;
  canCancelSale: boolean;
  canCloseSession: boolean;
  requiresManagerApproval: boolean;
}

export function isTerminalSale(status: CheckoutSaleStatus): boolean {
  return status === 'COMPLETED' || status === 'CANCELED';
}

export function resolveSaleStatusTone(
  status: CheckoutSaleStatus | undefined
): 'neutral' | 'success' | 'warning' {
  if (status === undefined) {
    return 'neutral';
  }

  if (status === 'OPEN' || status === 'COMPLETED') {
    return 'success';
  }

  if (status === 'PAID') {
    return 'warning';
  }

  return 'neutral';
}

export function resolveEventPublicationTone(
  status: CheckoutEventPublicationStatus
): 'success' | 'warning' {
  return status === 'published' ? 'success' : 'warning';
}

export function deriveRecoveredReceipt(sale: CheckoutSale | null): CheckoutSaleReceipt | null {
  if (
    sale === null ||
    sale.status !== 'COMPLETED' ||
    sale.paymentMethod === null ||
    sale.paidAmount === null ||
    sale.changeAmount === null ||
    sale.completedAt === null
  ) {
    return null;
  }

  return {
    saleId: sale.saleId,
    tenantId: sale.tenantId,
    sessionId: sale.sessionId,
    paymentMethod: sale.paymentMethod,
    paidAmount: sale.paidAmount,
    changeAmount: sale.changeAmount,
    totalItemsQuantity: sale.totalItemsQuantity,
    total: sale.total,
    completedAt: sale.completedAt,
    issuedAt: sale.completedAt,
    items: sale.items
  };
}

export function deriveCheckoutCapabilities(
  session: Pick<CheckoutPosSession, 'status'> | null,
  sale: CheckoutSale | null
): CheckoutCapabilities {
  const hasOpenSession = session?.status === 'OPEN';
  const hasMutableSale = sale?.status === 'OPEN';
  const saleSettled = sale === null || isTerminalSale(sale.status);

  return {
    hasOpenSession,
    hasMutableSale,
    canStartSale: hasOpenSession && saleSettled,
    canProcessPayment: sale?.status === 'OPEN' && sale.totalItemsQuantity > 0 && sale.total > 0,
    canCompleteSale: sale?.status === 'PAID',
    canCancelSale: hasOpenSession && sale !== null && sale.status !== 'CANCELED',
    canCloseSession: hasOpenSession && saleSettled,
    requiresManagerApproval: sale !== null && (sale.status === 'PAID' || sale.status === 'COMPLETED')
  };
}
