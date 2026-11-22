import type { CheckoutSale, CheckoutSaleReceipt, CompleteCheckoutSale } from '@supermarket/api-sdk';
import { checkoutSalePaymentMethods } from '@supermarket/api-sdk';
import { StatusPill } from '@supermarket/frontend-ui';
import type { UseFormReturn } from 'react-hook-form';

import { paymentFormSchema, type PaymentFormValues } from '../schemas/checkout-forms';
import { formatCurrency, formatDateTime, formatPaymentMethod, paymentMethodLabels } from '../lib/formatters';
import { submitSchemaValidatedForm } from '../lib/form-validation';
import { resolveEventPublicationTone, type CheckoutCapabilities } from '../lib/sale-state';
import {
  CheckoutFormCard,
  DefinitionList,
  FeedbackBanner,
  FormField,
  PrimaryButton,
  SecondaryButton,
  SelectInput,
  TextInput
} from './form-primitives';

interface PaymentCompletionPanelProps {
  paymentForm: UseFormReturn<PaymentFormValues>;
  activeSale: CheckoutSale | null;
  capabilities: Pick<CheckoutCapabilities, 'canProcessPayment' | 'canCompleteSale'>;
  formsLocked: boolean;
  isPaymentPending: boolean;
  isCompletionPending: boolean;
  completionResult: CompleteCheckoutSale | null;
  receiptToDisplay: CheckoutSaleReceipt | null;
  onSubmitPayment: (values: PaymentFormValues) => void;
  onCompleteSale: () => void;
}

export function PaymentCompletionPanel({
  paymentForm,
  activeSale,
  capabilities,
  formsLocked,
  isPaymentPending,
  isCompletionPending,
  completionResult,
  receiptToDisplay,
  onSubmitPayment,
  onCompleteSale
}: PaymentCompletionPanelProps) {
  const { canProcessPayment, canCompleteSale } = capabilities;

  return (
      <CheckoutFormCard
        title="Process payment and completion"
        description="Once the cart is ready, capture payment and transition into completion without leaving the cashier surface."
        actionLabel={canCompleteSale ? 'Ready to complete' : canProcessPayment ? 'Ready to pay' : 'Waiting for cart'}
        actionTone={canCompleteSale ? 'warning' : canProcessPayment ? 'success' : 'neutral'}
      >
        <div className="space-y-5">
          <form
            className="space-y-4"
            onSubmit={paymentForm.handleSubmit((values) => {
              submitSchemaValidatedForm(
                paymentForm,
                paymentFormSchema,
                values,
                (parsedValues) => {
                  onSubmitPayment(parsedValues);
                }
              );
            })}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Payment method"
                error={paymentForm.formState.errors.paymentMethod?.message}
              >
                <SelectInput
                  disabled={formsLocked || activeSale?.status !== 'OPEN'}
                  {...paymentForm.register('paymentMethod')}
                >
                  {checkoutSalePaymentMethods.map((paymentMethod) => (
                    <option key={paymentMethod} value={paymentMethod}>
                      {paymentMethodLabels[paymentMethod]}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
              <FormField
                label="Paid amount"
                hint="Non-cash payments must match the sale total exactly"
                error={paymentForm.formState.errors.paidAmount?.message}
              >
                <TextInput
                  inputMode="decimal"
                  placeholder={activeSale === null ? '0.00' : activeSale.total.toFixed(2)}
                  disabled={formsLocked || activeSale?.status !== 'OPEN'}
                  {...paymentForm.register('paidAmount')}
                />
              </FormField>
            </div>

            {activeSale === null ? (
              <FeedbackBanner
                tone="warning"
                title="Payment is waiting for an active sale"
                description="Open a session, start a sale, and add at least one item before processing payment."
              />
            ) : null}

            <div className="flex flex-wrap gap-3">
              <PrimaryButton
                type="submit"
                disabled={formsLocked || !canProcessPayment || isPaymentPending}
              >
                {isPaymentPending ? 'Processing...' : 'Process payment'}
              </PrimaryButton>
              <SecondaryButton
                type="button"
                disabled={activeSale === null}
                onClick={() => {
                  if (activeSale === null) {
                    return;
                  }

                  paymentForm.setValue('paidAmount', activeSale.total.toFixed(2), {
                    shouldDirty: true,
                    shouldValidate: true
                  });
                }}
              >
                Use exact total
              </SecondaryButton>
              <SecondaryButton
                type="button"
                disabled={formsLocked || !canCompleteSale || isCompletionPending}
                onClick={() => {
                  onCompleteSale();
                }}
              >
                {isCompletionPending ? 'Completing...' : 'Complete sale'}
              </SecondaryButton>
            </div>
          </form>

          {receiptToDisplay === null ? null : (
            <div className="space-y-4 rounded-2xl border border-line/80 bg-stone-50 px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Receipt summary</p>
                  <p className="mt-1 text-sm text-muted">
                    {completionResult === null
                      ? 'Recovered from the local terminal sale state.'
                      : `Completion event ${completionResult.eventPublicationStatus}.`}
                  </p>
                </div>
                <StatusPill
                  tone={
                    completionResult === null
                      ? 'neutral'
                      : resolveEventPublicationTone(completionResult.eventPublicationStatus)
                  }
                >
                  {completionResult?.eventPublicationStatus ?? 'Recovered locally'}
                </StatusPill>
              </div>

              <DefinitionList
                items={[
                  { label: 'Payment method', value: formatPaymentMethod(receiptToDisplay.paymentMethod) },
                  { label: 'Paid amount', value: formatCurrency(receiptToDisplay.paidAmount) },
                  { label: 'Change', value: formatCurrency(receiptToDisplay.changeAmount) },
                  { label: 'Issued at', value: formatDateTime(receiptToDisplay.issuedAt) }
                ]}
              />
            </div>
          )}
        </div>
      </CheckoutFormCard>
  );
}
