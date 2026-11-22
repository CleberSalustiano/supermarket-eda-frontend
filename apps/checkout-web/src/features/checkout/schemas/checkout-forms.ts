import { checkoutSalePaymentMethods } from '@supermarket/api-sdk';
import { z } from 'zod';

const moneyPattern = /^\d+(?:\.\d{1,2})?$/;
const positiveIntegerPattern = /^[1-9]\d*$/;

export const tenantIdSchema = z.string().uuid('Tenant id must be a valid UUID.');

export const openSessionFormSchema = z.object({
  registerId: z.string().trim().min(2, 'Register id must have at least 2 characters.').max(32),
  operatorId: z.string().uuid('Operator id must be a valid UUID.'),
  openingFloatAmount: z
    .string()
    .trim()
    .regex(moneyPattern, 'Opening float must be a valid amount with up to 2 decimals.')
});

export const cartMutationFormSchema = z.object({
  barcode: z.string().trim().min(4, 'Barcode must have at least 4 characters.').max(64),
  quantity: z
    .string()
    .trim()
    .regex(positiveIntegerPattern, 'Quantity must be a positive whole number.')
});

export const paymentFormSchema = z.object({
  paymentMethod: z.enum(checkoutSalePaymentMethods, 'Payment method is required.'),
  paidAmount: z
    .string()
    .trim()
    .regex(moneyPattern, 'Paid amount must be a valid amount with up to 2 decimals.')
    .refine((value) => Number(value) > 0, 'Paid amount must be greater than zero.')
});

export const cancelSaleFormSchema = z.object({
  reason: z.string().trim().min(4, 'Cancellation reason must have at least 4 characters.').max(255),
  managerApprovalCode: z.string().trim().max(64)
});

export const closeSessionFormSchema = z.object({
  declaredCashAmount: z
    .string()
    .trim()
    .regex(moneyPattern, 'Declared cash amount must be a valid amount with up to 2 decimals.')
});

export type OpenSessionFormValues = z.infer<typeof openSessionFormSchema>;
export type CartMutationFormValues = z.infer<typeof cartMutationFormSchema>;
export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
export type CancelSaleFormValues = z.infer<typeof cancelSaleFormSchema>;
export type CloseSessionFormValues = z.infer<typeof closeSessionFormSchema>;
