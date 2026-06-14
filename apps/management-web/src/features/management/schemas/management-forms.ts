import { z } from 'zod';

import { managementEmployeeRoles } from '@supermarket/api-sdk';

const moneyPattern = /^\d+(?:\.\d{1,2})?$/;

export const tenantIdSchema = z.string().uuid('Tenant id must be a valid UUID.');

export const registerProductFormSchema = z.object({
  name: z.string().trim().min(2, 'Product name must have at least 2 characters.').max(120),
  barcode: z.string().trim().min(4, 'Barcode must have at least 4 characters.').max(64),
  unitOfMeasure: z
    .string()
    .trim()
    .min(1, 'Unit of measure is required.')
    .max(16)
    .transform((value) => value.toUpperCase()),
  price: z
    .string()
    .trim()
    .regex(moneyPattern, 'Price must be a valid amount with up to 2 decimals.')
});

export const updateProductPriceFormSchema = z.object({
  productId: z.string().uuid('Product id must be a valid UUID.'),
  price: z
    .string()
    .trim()
    .regex(moneyPattern, 'Price must be a valid amount with up to 2 decimals.')
});

export const registerEmployeeFormSchema = z.object({
  employeeCode: z.string().trim().min(2, 'Employee code must have at least 2 characters.').max(32),
  fullName: z.string().trim().min(3, 'Full name must have at least 3 characters.').max(120),
  role: z.enum(managementEmployeeRoles, 'Employee role is required.'),
  pin: z
    .string()
    .trim()
    .regex(/^\d{4,12}$/, 'PIN must contain 4 to 12 digits.')
});

export const profitAndLossFormSchema = z
  .object({
    fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'From date must use YYYY-MM-DD.'),
    toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'To date must use YYYY-MM-DD.')
  })
  .superRefine((value, context) => {
    if (value.fromDate > value.toDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'From date cannot be later than to date.',
        path: ['toDate']
      });
    }
  });

export type RegisterProductFormValues = z.infer<typeof registerProductFormSchema>;
export type UpdateProductPriceFormValues = z.infer<typeof updateProductPriceFormSchema>;
export type RegisterEmployeeFormValues = z.infer<typeof registerEmployeeFormSchema>;
export type ProfitAndLossFormValues = z.infer<typeof profitAndLossFormSchema>;
