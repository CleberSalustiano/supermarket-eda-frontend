import { z } from 'zod';

const moneyPattern = /^\d+(?:\.\d{1,2})?$/;
const positiveIntegerPattern = /^[1-9]\d*$/;

export const tenantIdSchema = z.string().uuid('Tenant id must be a valid UUID.');

export const openSessionFormSchema = z.object({
  registerId: z.string().trim().min(2, 'Register id must have at least 2 characters.').max(32),
  operatorId: z.string().trim().min(2, 'Operator id must have at least 2 characters.').max(32),
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

export type OpenSessionFormValues = z.infer<typeof openSessionFormSchema>;
export type CartMutationFormValues = z.infer<typeof cartMutationFormSchema>;
