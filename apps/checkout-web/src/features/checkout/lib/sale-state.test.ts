import type { CheckoutSale, CheckoutSaleStatus } from '@supermarket/api-sdk';
import { describe, expect, it } from 'vitest';

import {
  deriveCheckoutCapabilities,
  deriveRecoveredReceipt,
  isTerminalSale,
  resolveEventPublicationTone,
  resolveSaleStatusTone
} from './sale-state';

function createSale(overrides: Partial<CheckoutSale> = {}): CheckoutSale {
  return {
    saleId: 'bb5c0b0c-6d3a-4e1e-8b7a-3c2d1e0f9a8b',
    tenantId: '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1',
    sessionId: '0f1e2d3c-4b5a-4968-8776-655443322110',
    status: 'OPEN',
    paymentMethod: null,
    paidAmount: null,
    changeAmount: null,
    paidAt: null,
    completedAt: null,
    canceledAt: null,
    cancellationReason: null,
    totalItemsQuantity: 2,
    subtotal: 20,
    total: 20,
    items: [],
    createdAt: '2026-06-14T12:00:00.000Z',
    updatedAt: '2026-06-14T12:00:00.000Z',
    ...overrides
  };
}

function createPaidSale(status: CheckoutSaleStatus): CheckoutSale {
  return createSale({
    status,
    paymentMethod: 'CASH',
    paidAmount: 50,
    changeAmount: 30,
    paidAt: '2026-06-14T12:01:00.000Z',
    completedAt: status === 'COMPLETED' ? '2026-06-14T12:02:00.000Z' : null
  });
}

const openSession = { status: 'OPEN' } as const;
const closedSession = { status: 'CLOSED' } as const;

describe('deriveCheckoutCapabilities', () => {
  it('allows nothing without a session or a sale', () => {
    expect(deriveCheckoutCapabilities(null, null)).toEqual({
      hasOpenSession: false,
      hasMutableSale: false,
      canStartSale: false,
      canProcessPayment: false,
      canCompleteSale: false,
      canCancelSale: false,
      canCloseSession: false,
      requiresManagerApproval: false
    });
  });

  it('blocks starting, cancelling and closing when the session is closed', () => {
    const capabilities = deriveCheckoutCapabilities(closedSession, createPaidSale('COMPLETED'));

    expect(capabilities.hasOpenSession).toBe(false);
    expect(capabilities.canStartSale).toBe(false);
    expect(capabilities.canCancelSale).toBe(false);
    expect(capabilities.canCloseSession).toBe(false);
  });

  it('allows starting a sale and closing the register for an open session without a sale', () => {
    const capabilities = deriveCheckoutCapabilities(openSession, null);

    expect(capabilities.hasOpenSession).toBe(true);
    expect(capabilities.canStartSale).toBe(true);
    expect(capabilities.canCloseSession).toBe(true);
    expect(capabilities.canCancelSale).toBe(false);
    expect(capabilities.canProcessPayment).toBe(false);
  });

  it('blocks payment for an open sale with an empty cart or a zero total', () => {
    const emptyCart = createSale({ totalItemsQuantity: 0, total: 0, subtotal: 0 });
    const zeroTotal = createSale({ total: 0 });

    expect(deriveCheckoutCapabilities(openSession, emptyCart).canProcessPayment).toBe(false);
    expect(deriveCheckoutCapabilities(openSession, zeroTotal).canProcessPayment).toBe(false);
  });

  it('allows payment and cancellation but blocks closure for an open sale with items', () => {
    const capabilities = deriveCheckoutCapabilities(openSession, createSale());

    expect(capabilities.hasMutableSale).toBe(true);
    expect(capabilities.canProcessPayment).toBe(true);
    expect(capabilities.canCompleteSale).toBe(false);
    expect(capabilities.canCancelSale).toBe(true);
    expect(capabilities.canStartSale).toBe(false);
    expect(capabilities.canCloseSession).toBe(false);
    expect(capabilities.requiresManagerApproval).toBe(false);
  });

  it('allows completion, requires manager approval and blocks closure for a paid sale', () => {
    const capabilities = deriveCheckoutCapabilities(openSession, createPaidSale('PAID'));

    expect(capabilities.hasMutableSale).toBe(false);
    expect(capabilities.canProcessPayment).toBe(false);
    expect(capabilities.canCompleteSale).toBe(true);
    expect(capabilities.canCancelSale).toBe(true);
    expect(capabilities.requiresManagerApproval).toBe(true);
    expect(capabilities.canCloseSession).toBe(false);
  });

  it('allows starting, closing and approved cancellation for a completed sale', () => {
    const capabilities = deriveCheckoutCapabilities(openSession, createPaidSale('COMPLETED'));

    expect(capabilities.canCompleteSale).toBe(false);
    expect(capabilities.canCancelSale).toBe(true);
    expect(capabilities.requiresManagerApproval).toBe(true);
    expect(capabilities.canStartSale).toBe(true);
    expect(capabilities.canCloseSession).toBe(true);
  });

  it('blocks cancellation and manager approval but allows closure for a canceled sale', () => {
    const capabilities = deriveCheckoutCapabilities(
      openSession,
      createSale({ status: 'CANCELED' })
    );

    expect(capabilities.canCancelSale).toBe(false);
    expect(capabilities.requiresManagerApproval).toBe(false);
    expect(capabilities.canStartSale).toBe(true);
    expect(capabilities.canCloseSession).toBe(true);
    expect(capabilities.canProcessPayment).toBe(false);
  });
});

describe('deriveRecoveredReceipt', () => {
  it('returns null without a sale', () => {
    expect(deriveRecoveredReceipt(null)).toBeNull();
  });

  it('returns null for sales that are not completed', () => {
    expect(deriveRecoveredReceipt(createSale())).toBeNull();
    expect(deriveRecoveredReceipt(createPaidSale('PAID'))).toBeNull();
  });

  it('returns null when a completed sale lacks payment or completion data', () => {
    const completed = createPaidSale('COMPLETED');

    expect(deriveRecoveredReceipt({ ...completed, paymentMethod: null })).toBeNull();
    expect(deriveRecoveredReceipt({ ...completed, paidAmount: null })).toBeNull();
    expect(deriveRecoveredReceipt({ ...completed, changeAmount: null })).toBeNull();
    expect(deriveRecoveredReceipt({ ...completed, completedAt: null })).toBeNull();
  });

  it('builds the receipt with issuedAt equal to completedAt for a completed sale', () => {
    const completed = createPaidSale('COMPLETED');

    expect(deriveRecoveredReceipt(completed)).toEqual({
      saleId: completed.saleId,
      tenantId: completed.tenantId,
      sessionId: completed.sessionId,
      paymentMethod: 'CASH',
      paidAmount: 50,
      changeAmount: 30,
      totalItemsQuantity: 2,
      total: 20,
      completedAt: '2026-06-14T12:02:00.000Z',
      issuedAt: '2026-06-14T12:02:00.000Z',
      items: []
    });
  });
});

describe('status helpers', () => {
  it('identifies terminal sales', () => {
    expect(isTerminalSale('COMPLETED')).toBe(true);
    expect(isTerminalSale('CANCELED')).toBe(true);
    expect(isTerminalSale('OPEN')).toBe(false);
    expect(isTerminalSale('PAID')).toBe(false);
  });

  it('resolves tones', () => {
    expect(resolveSaleStatusTone(undefined)).toBe('neutral');
    expect(resolveSaleStatusTone('OPEN')).toBe('success');
    expect(resolveSaleStatusTone('COMPLETED')).toBe('success');
    expect(resolveSaleStatusTone('PAID')).toBe('warning');
    expect(resolveSaleStatusTone('CANCELED')).toBe('neutral');
    expect(resolveEventPublicationTone('published')).toBe('success');
    expect(resolveEventPublicationTone('pending')).toBe('warning');
  });
});
