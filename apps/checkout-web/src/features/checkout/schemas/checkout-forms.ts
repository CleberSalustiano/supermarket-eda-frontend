import { checkoutSalePaymentMethods } from '@supermarket/api-sdk';
import type { LocaleFormat } from '@supermarket/frontend-i18n';
import { z } from 'zod';

import type { CheckoutMessages } from '../../../i18n';

const MIN_REASON_LENGTH = 4;
const MAX_REASON_LENGTH = 255;
export const MAX_MANAGER_EMPLOYEE_CODE_LENGTH = 32;
export const MAX_MANAGER_PIN_LENGTH = 12;
const MIN_MANAGER_EMPLOYEE_CODE_LENGTH = 2;
const MANAGER_PIN_PATTERN = /^\d{4,12}$/;

/** Register opening: user-facing messages and decimal rules follow the active locale. */
export function createOpenSessionSchema(m: CheckoutMessages, fmt: LocaleFormat) {
  return z.object({
    registerId: z.string().trim().min(2, m.validation.registerId).max(32, m.validation.registerId),
    operatorId: z.string().trim().uuid(m.validation.operatorId),
    openingFloatAmount: z.string().trim().regex(fmt.decimalPattern, m.validation.money)
  });
}

export function createPaymentSchema(m: CheckoutMessages, fmt: LocaleFormat) {
  return z.object({
    paymentMethod: z.enum(checkoutSalePaymentMethods),
    paidAmount: z
      .string()
      .trim()
      .regex(fmt.decimalPattern, m.validation.money)
      .refine((value) => (fmt.parseDecimal(value) ?? 0) > 0, m.validation.positive)
  });
}

/** The manager code and PIN are verified by Management; they are only validated here when required. */
export function createCancelSaleSchema(m: CheckoutMessages, requiresManagerApproval: boolean) {
  return z
    .object({
      reason: z
        .string()
        .trim()
        .min(MIN_REASON_LENGTH, m.validation.reason)
        .max(MAX_REASON_LENGTH, m.validation.reason),
      managerEmployeeCode: z.string().trim(),
      managerPin: z.string()
    })
    .superRefine((values, context) => {
      if (!requiresManagerApproval) {
        return;
      }
      const codeLength = values.managerEmployeeCode.length;
      if (codeLength < MIN_MANAGER_EMPLOYEE_CODE_LENGTH || codeLength > MAX_MANAGER_EMPLOYEE_CODE_LENGTH) {
        context.addIssue({
          code: 'custom',
          path: ['managerEmployeeCode'],
          message: m.cancel.managerCodeRequired
        });
      }
      if (!MANAGER_PIN_PATTERN.test(values.managerPin)) {
        context.addIssue({
          code: 'custom',
          path: ['managerPin'],
          message: m.cancel.managerPinInvalid
        });
      }
    });
}

export function createCloseSessionSchema(m: CheckoutMessages, fmt: LocaleFormat) {
  return z.object({
    declaredCashAmount: z.string().trim().regex(fmt.decimalPattern, m.validation.money)
  });
}

export type OpenSessionFormValues = z.infer<ReturnType<typeof createOpenSessionSchema>>;
export type PaymentFormValues = z.infer<ReturnType<typeof createPaymentSchema>>;
export type CancelSaleFormValues = z.infer<ReturnType<typeof createCancelSaleSchema>>;
export type CloseSessionFormValues = z.infer<ReturnType<typeof createCloseSessionSchema>>;
