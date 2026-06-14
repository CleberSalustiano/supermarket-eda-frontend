import { z } from 'zod';

export const defaultCheckoutTenantId = '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1';
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

const checkoutSaleSchema = z.object({
  saleId: z.string().uuid(),
  tenantId: z.string().uuid(),
  sessionId: z.string().uuid(),
  status: z.enum(['OPEN', 'PAID', 'COMPLETED', 'CANCELED']),
  paymentMethod: z.string().nullable(),
  paidAmount: z.number().nullable(),
  changeAmount: z.number().nullable(),
  paidAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  canceledAt: z.string().nullable(),
  cancellationReason: z.string().nullable(),
  totalItemsQuantity: z.number().int().nonnegative(),
  subtotal: z.number(),
  total: z.number(),
  items: z.array(checkoutSaleItemSchema),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const checkoutWorkspaceStateSchema = z.object({
  tenantId: z.string().trim().min(1),
  activeSession: checkoutPosSessionSchema.nullable(),
  activeSale: checkoutSaleSchema.nullable()
});

export type CheckoutWorkspaceState = z.infer<typeof checkoutWorkspaceStateSchema>;

export function createDefaultCheckoutWorkspaceState(): CheckoutWorkspaceState {
  return {
    tenantId: defaultCheckoutTenantId,
    activeSession: null,
    activeSale: null
  };
}

export function parseCheckoutWorkspaceState(
  value: string | null
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

    return validationResult.data;
  } catch {
    return createDefaultCheckoutWorkspaceState();
  }
}
