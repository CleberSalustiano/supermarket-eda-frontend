import { useEffect, useMemo, useRef, type RefCallback, type RefObject } from 'react';

import { useForm, type UseFormReturn } from 'react-hook-form';

import { useI18n } from '../../../i18n';
import { formatDecimalInput } from '../lib/decimal-input';
import { submitSchemaValidatedForm } from '../lib/form-validation';
import { createPaymentSchema, type PaymentFormValues } from '../schemas/checkout-forms';
import type { PaymentInput } from './use-cashier-actions';

const EMPTY_VALUES: PaymentFormValues = { paymentMethod: 'CASH', paidAmount: '' };

export interface PaymentFormController {
  form: UseFormReturn<PaymentFormValues>;
  amountRef: RefObject<HTMLInputElement | null>;
  /** Registers the amount input and keeps `amountRef` pointing at it. */
  amountRegistration: ReturnType<UseFormReturn<PaymentFormValues>['register']> & {
    ref: RefCallback<HTMLInputElement>;
  };
  paidAmount: number | null;
  /** Cash received is below the total; the backend stays authoritative. */
  isShort: boolean;
  /** Validates and sends the payment. */
  submit: () => void;
  /** F8: focus the amount while it is empty, submit once it is filled. */
  submitOrFocus: () => void;
  setExactAmount: () => void;
}

/** Payment form state for the current sale: non-cash methods always carry the exact total. */
export function usePaymentForm(
  saleId: string | null,
  total: number,
  onPay: (input: PaymentInput) => void
): PaymentFormController {
  const { m, fmt } = useI18n();
  const schema = useMemo(() => createPaymentSchema(m, fmt), [m, fmt]);
  const form = useForm<PaymentFormValues>({ defaultValues: EMPTY_VALUES });
  const amountRef = useRef<HTMLInputElement | null>(null);
  const previousMethodRef = useRef<PaymentFormValues['paymentMethod']>('CASH');
  const paymentMethod = form.watch('paymentMethod');
  const paidText = form.watch('paidAmount');

  useEffect(() => {
    form.reset(EMPTY_VALUES);
    previousMethodRef.current = 'CASH';
    // A new sale starts from a clean cash payment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleId]);

  useEffect(() => {
    const previousMethod = previousMethodRef.current;
    previousMethodRef.current = paymentMethod;

    if (paymentMethod === 'CASH') {
      if (previousMethod !== 'CASH') {
        form.setValue('paidAmount', '');
      }

      return;
    }

    form.setValue('paidAmount', formatDecimalInput(total, fmt));
    form.clearErrors('paidAmount');
    // The amount follows the total for non-cash methods.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, total, fmt]);

  const register = form.register('paidAmount');
  const amountRegistration = {
    ...register,
    ref: (node: HTMLInputElement | null) => {
      register.ref(node);
      amountRef.current = node;
    }
  };

  const parsedPaidAmount = paidText.trim().length === 0 ? null : fmt.parseDecimal(paidText.trim());
  const isShort = paymentMethod === 'CASH' && parsedPaidAmount !== null && parsedPaidAmount < total;

  const submit = form.handleSubmit((values) => {
    if (isShort) {
      return;
    }

    submitSchemaValidatedForm(form, schema, values, (parsed) => {
      const amount = fmt.parseDecimal(parsed.paidAmount);

      if (amount === null) {
        form.setError('paidAmount', { type: 'manual', message: m.validation.money });
        return;
      }

      onPay({ paymentMethod: parsed.paymentMethod, paidAmount: amount });
    });
  });

  return {
    form,
    amountRef,
    amountRegistration,
    paidAmount: parsedPaidAmount,
    isShort,
    submit: () => {
      void submit();
    },
    submitOrFocus: () => {
      if (form.getValues('paidAmount').trim().length === 0) {
        amountRef.current?.focus();
        return;
      }

      void submit();
    },
    setExactAmount: () => {
      form.setValue('paidAmount', formatDecimalInput(total, fmt), {
        shouldDirty: true,
        shouldValidate: true
      });
    }
  };
}
