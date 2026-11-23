import { managementEmployeeRoles } from '@supermarket/api-sdk';
import type { LocaleFormat } from '@supermarket/frontend-i18n';
import { z } from 'zod';

import type { ManagementMessages } from '../../../i18n';

export type FormContext = { m: ManagementMessages; fmt: LocaleFormat };

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function moneyField({ m, fmt }: FormContext) {
  return z
    .string()
    .trim()
    .refine((value) => fmt.parseDecimal(value) !== null, m.validation.money);
}

export function createRegisterProductSchema(context: FormContext) {
  const { m } = context;

  return z.object({
    name: z.string().trim().min(2, m.validation.name).max(120, m.validation.name),
    barcode: z.string().trim().min(4, m.validation.barcode).max(64, m.validation.barcode),
    unitOfMeasure: z.string().trim().min(1, m.validation.unit).max(16, m.validation.unit),
    price: moneyField(context)
  });
}

export function createUpdateProductPriceSchema(context: FormContext) {
  const { m } = context;

  return z.object({
    productId: z.string().trim().regex(uuidPattern, m.validation.productId),
    price: moneyField(context)
  });
}

export function createRegisterEmployeeSchema({ m }: FormContext) {
  return z.object({
    employeeCode: z.string().trim().min(2, m.validation.employeeCode).max(32, m.validation.employeeCode),
    fullName: z.string().trim().min(3, m.validation.fullName).max(120, m.validation.fullName),
    role: z.enum(managementEmployeeRoles),
    pin: z.string().trim().regex(/^\d{4,12}$/, m.validation.pin)
  });
}

export function createChangeEmployeePinSchema({ m }: FormContext) {
  return z
    .object({
      pin: z.string().trim().regex(/^\d{4,12}$/, m.validation.pin),
      confirmPin: z.string().trim()
    })
    .refine((value) => value.pin === value.confirmPin, {
      message: m.employees.pin.mismatch,
      path: ['confirmPin']
    });
}

export function createProfitAndLossSchema({ m }: FormContext) {
  return z
    .object({
      fromDate: z.string().regex(isoDatePattern, m.validation.dateOrder),
      toDate: z.string().regex(isoDatePattern, m.validation.dateOrder)
    })
    .refine((value) => value.fromDate <= value.toDate, {
      message: m.validation.dateOrder,
      path: ['toDate']
    });
}

export type RegisterProductFormValues = z.infer<ReturnType<typeof createRegisterProductSchema>>;
export type UpdateProductPriceFormValues = z.infer<ReturnType<typeof createUpdateProductPriceSchema>>;
export type RegisterEmployeeFormValues = z.infer<ReturnType<typeof createRegisterEmployeeSchema>>;
export type ChangeEmployeePinFormValues = z.infer<ReturnType<typeof createChangeEmployeePinSchema>>;
export type ProfitAndLossFormValues = z.infer<ReturnType<typeof createProfitAndLossSchema>>;
