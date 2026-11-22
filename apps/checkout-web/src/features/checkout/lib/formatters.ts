import type { CheckoutSalePaymentMethod } from '@supermarket/api-sdk';

export const paymentMethodLabels: Record<CheckoutSalePaymentMethod, string> = {
  CASH: 'Cash',
  CREDIT_CARD: 'Credit card',
  DEBIT_CARD: 'Debit card',
  PIX: 'Pix',
  VOUCHER: 'Voucher'
};

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function formatPaymentMethod(paymentMethod: CheckoutSalePaymentMethod): string {
  return paymentMethodLabels[paymentMethod];
}

export function shortenUuid(value: string): string {
  return value.length <= 12 ? value : `${value.slice(0, 8)}...`;
}
