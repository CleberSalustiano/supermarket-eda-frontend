import { checkoutSalePaymentMethods } from '@supermarket/api-sdk';
import { z } from 'zod';

export const checkoutWorkspaceStorageKey = 'supermarket.checkout.workspace';

const checkoutPosSessionSchema = z.object({
  sessionId: z.string().uuid(),
  tenantId: z.string().uuid(),
  registerId: z.string().trim().min(1),
  operatorId: z.string().trim().min(1),
  openingFloatAmount: z.number(),
  declaredCashAmount: z.number().nullable(),
  status: z.enum(['OPEN', 'CLOSED']),
  openedAt: z.string(),
  closedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

const checkoutSaleItemSchema = z.object({
  productId: z.string().uuid(),
  barcode: z.string().trim().min(1),
  name: z.string().trim().min(1),
  unitOfMeasure: z.string().trim().min(1),
  unitPrice: z.number(),
  quantity: z.number().int().positive(),
  lineTotal: z.number()
});

const checkoutSaleApproverSchema = z.object({
  employeeId: z.string().min(1),
  employeeCode: z.string().min(1),
  fullName: z.string().min(1)
});

const checkoutSaleSchema = z.object({
  saleId: z.string().uuid(),
  tenantId: z.string().uuid(),
  sessionId: z.string().uuid(),
  status: z.enum(['OPEN', 'PAID', 'COMPLETED', 'CANCELED']),
  paymentMethod: z.enum(checkoutSalePaymentMethods).nullable(),
  paidAmount: z.number().nullable(),
  changeAmount: z.number().nullable(),
  paidAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  canceledAt: z.string().nullable(),
  cancellationReason: z.string().nullable(),
  // Sales stored before manager verification existed have no approver.
  cancellationApprovedBy: checkoutSaleApproverSchema.nullish().transform((value) => value ?? null),
  totalItemsQuantity: z.number().int().nonnegative(),
  subtotal: z.number(),
  total: z.number(),
  items: z.array(checkoutSaleItemSchema),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const checkoutWorkspaceStateSchema = z.object({
  activeSession: checkoutPosSessionSchema.nullable(),
  activeSale: checkoutSaleSchema.nullable()
});

export type CheckoutWorkspaceState = z.infer<typeof checkoutWorkspaceStateSchema>;

export function createDefaultCheckoutWorkspaceState(): CheckoutWorkspaceState {
  return {
    activeSession: null,
    activeSale: null
  };
}

/**
 * Restores the persisted workspace. A workspace saved for another tenant is discarded,
 * because its session and sale cannot be used with the current tenant.
 */
export function parseCheckoutWorkspaceState(
  value: string | null,
  tenantId: string
): CheckoutWorkspaceState {
  if (value === null || value.trim().length === 0) {
    return createDefaultCheckoutWorkspaceState();
  }

  try {
    const parsedValue = JSON.parse(value) as unknown;
    const validationResult = checkoutWorkspaceStateSchema.safeParse(parsedValue);

    if (!validationResult.success) {
      return createDefaultCheckoutWorkspaceState();
    }

    const { activeSession } = validationResult.data;

    if (activeSession !== null && activeSession.tenantId !== tenantId) {
      return createDefaultCheckoutWorkspaceState();
    }

    return validationResult.data;
  } catch {
    return createDefaultCheckoutWorkspaceState();
  }
}
