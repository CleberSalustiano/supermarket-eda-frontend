import { describe, expect, it } from 'vitest';

import { checkoutWorkspaceStorageKey, parseCheckoutWorkspaceState } from './workspace';

const tenantId = '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1';

function storedSale(extra: Record<string, unknown>): string {
  return JSON.stringify({
    activeSession: null,
    activeSale: {
      saleId: 'd02f33a7-f2af-4623-a218-d1ed9dc11fd1',
      tenantId,
      sessionId: '1c7281cc-c5ee-474a-884d-42d9b9be8293',
      status: 'CANCELED',
      paymentMethod: null,
      paidAmount: null,
      changeAmount: null,
      paidAt: null,
      completedAt: null,
      canceledAt: '2026-06-14T12:05:00.000Z',
      cancellationReason: 'Wrong payment method',
      totalItemsQuantity: 0,
      subtotal: 0,
      total: 0,
      items: [],
      createdAt: '2026-06-14T12:01:00.000Z',
      updatedAt: '2026-06-14T12:05:00.000Z',
      ...extra
    }
  });
}

describe('checkout workspace persistence', () => {
  it('uses a stable storage key', () => {
    expect(checkoutWorkspaceStorageKey).toBe('supermarket.checkout.workspace');
  });

  it('normalises a stored sale without an approver to null', () => {
    const state = parseCheckoutWorkspaceState(storedSale({}), tenantId);

    expect(state.activeSale?.cancellationApprovedBy).toBeNull();
  });

  it('keeps a stored approver', () => {
    const approver = {
      employeeId: '5a1d1c68-3a0c-4f0e-9f84-0f0f7d9a2b11',
      employeeCode: 'MANAGER-01',
      fullName: 'Bruno Lima'
    };

    const state = parseCheckoutWorkspaceState(storedSale({ cancellationApprovedBy: approver }), tenantId);

    expect(state.activeSale?.cancellationApprovedBy).toEqual(approver);
  });
});
