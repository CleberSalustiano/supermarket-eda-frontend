import type {
  CancelCheckoutSale,
  CheckoutPosSession,
  CheckoutSale,
  CloseCheckoutPosSession
} from '@supermarket/api-sdk';
import { StatusPill } from '@supermarket/frontend-ui';
import type { UseFormReturn } from 'react-hook-form';

import {
  cancelSaleFormSchema,
  closeSessionFormSchema,
  type CancelSaleFormValues,
  type CloseSessionFormValues
} from '../schemas/checkout-forms';
import { formatCurrency, formatDateTime, formatPaymentMethod } from '../lib/formatters';
import { submitSchemaValidatedForm } from '../lib/form-validation';
import { resolveEventPublicationTone, type CheckoutCapabilities } from '../lib/sale-state';
import {
  CheckoutFormCard,
  DefinitionList,
  FeedbackBanner,
  FormField,
  PrimaryButton,
  SecondaryButton,
  TextInput
} from './form-primitives';

interface CancellationClosurePanelProps {
  cancelSaleForm: UseFormReturn<CancelSaleFormValues>;
  closeSessionForm: UseFormReturn<CloseSessionFormValues>;
  activeSale: CheckoutSale | null;
  activeSession: CheckoutPosSession | null;
  capabilities: Pick<
    CheckoutCapabilities,
    'hasOpenSession' | 'canCancelSale' | 'canCloseSession' | 'requiresManagerApproval'
  >;
  formsLocked: boolean;
  isCancellationPending: boolean;
  isClosurePending: boolean;
  cancellationResult: CancelCheckoutSale | null;
  closureResult: CloseCheckoutPosSession | null;
  onCancelSale: (values: CancelSaleFormValues) => void;
  onCloseSession: (values: CloseSessionFormValues) => void;
}

export function CancellationClosurePanel({
  cancelSaleForm,
  closeSessionForm,
  activeSale,
  activeSession,
  capabilities,
  formsLocked,
  isCancellationPending,
  isClosurePending,
  cancellationResult,
  closureResult,
  onCancelSale,
  onCloseSession
}: CancellationClosurePanelProps) {
  const { hasOpenSession, canCancelSale, canCloseSession, requiresManagerApproval } = capabilities;

  return (
      <CheckoutFormCard
        title="Cancellation and register closure"
        description="Handle terminal exceptions and the end-of-shift cash declaration with the same direct backend rules the POS service enforces."
        actionLabel={canCloseSession ? 'Closure ready' : 'Operational safeguards'}
        actionTone={canCloseSession ? 'success' : 'warning'}
      >
        <div className="space-y-5">
          <form
            className="space-y-4"
            onSubmit={cancelSaleForm.handleSubmit((values) => {
              submitSchemaValidatedForm(
                cancelSaleForm,
                cancelSaleFormSchema,
                values,
                (parsedValues) => {
                  if (requiresManagerApproval && parsedValues.managerApprovalCode.trim().length === 0) {
                    cancelSaleForm.setError('managerApprovalCode', {
                      type: 'manual',
                      message: 'Manager approval code is required after payment or completion.'
                    });

                    return;
                  }

                  onCancelSale(parsedValues);
                }
              );
            })}
          >
            <FormField
              label="Cancellation reason"
              hint="Required whenever the active sale is canceled"
              error={cancelSaleForm.formState.errors.reason?.message}
            >
              <TextInput
                placeholder="Customer requested reversal"
                disabled={formsLocked || !canCancelSale || isCancellationPending}
                {...cancelSaleForm.register('reason')}
              />
            </FormField>
            <FormField
              label="Manager approval code"
              hint={`Provisional: not validated until manager credentials exist. ${requiresManagerApproval ? 'Required for paid or completed sales' : 'Optional for open sales'}`}
              error={cancelSaleForm.formState.errors.managerApprovalCode?.message}
            >
              <TextInput
                placeholder="MGR-2048"
                disabled={formsLocked || !canCancelSale || isCancellationPending}
                {...cancelSaleForm.register('managerApprovalCode')}
              />
            </FormField>

            <div className="flex flex-wrap gap-3">
              <PrimaryButton
                type="submit"
                disabled={formsLocked || !canCancelSale || isCancellationPending}
              >
                {isCancellationPending ? 'Canceling...' : 'Cancel sale'}
              </PrimaryButton>
              <SecondaryButton
                type="button"
                onClick={() => {
                  cancelSaleForm.reset({
                    reason: '',
                    managerApprovalCode: ''
                  });
                }}
              >
                Clear cancellation form
              </SecondaryButton>
            </div>
          </form>

          {activeSale !== null && activeSale.status === 'CANCELED' ? (
            <div className="space-y-4 rounded-2xl border border-line/80 bg-stone-50 px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Cancellation summary</p>
                  <p className="mt-1 text-sm text-muted">
                    {cancellationResult === null
                      ? 'Recovered from the local terminal sale state.'
                      : `Cancellation event ${cancellationResult.eventPublicationStatus}.`}
                  </p>
                </div>
                <StatusPill
                  tone={
                    cancellationResult === null
                      ? 'neutral'
                      : resolveEventPublicationTone(cancellationResult.eventPublicationStatus)
                  }
                >
                  {cancellationResult?.eventPublicationStatus ?? 'Recovered locally'}
                </StatusPill>
              </div>

              <DefinitionList
                items={[
                  { label: 'Canceled at', value: activeSale.canceledAt === null ? 'Unavailable' : formatDateTime(activeSale.canceledAt) },
                  { label: 'Reason', value: activeSale.cancellationReason ?? 'Unavailable' },
                  { label: 'Sale total', value: formatCurrency(activeSale.total) },
                  { label: 'Payment method', value: activeSale.paymentMethod ? formatPaymentMethod(activeSale.paymentMethod) : 'Not paid' }
                ]}
              />
            </div>
          ) : null}

          <div className="border-t border-line pt-5">
            <form
              className="space-y-4"
              onSubmit={closeSessionForm.handleSubmit((values) => {
                submitSchemaValidatedForm(
                  closeSessionForm,
                  closeSessionFormSchema,
                  values,
                  (parsedValues) => {
                    onCloseSession(parsedValues);
                  }
                );
              })}
            >
              <FormField
                label="Declared cash amount"
                hint="Operator-declared physical cash at closure"
                error={closeSessionForm.formState.errors.declaredCashAmount?.message}
              >
                <TextInput
                  inputMode="decimal"
                  placeholder="150.00"
                  disabled={formsLocked || !canCloseSession || isClosurePending}
                  {...closeSessionForm.register('declaredCashAmount')}
                />
              </FormField>

              {!canCloseSession && hasOpenSession ? (
                <FeedbackBanner
                  tone="warning"
                  title="Register closure is blocked"
                  description="The session can only be closed when there is no active sale or when the current sale is already completed or canceled."
                />
              ) : null}

              <div className="flex flex-wrap gap-3">
                <PrimaryButton
                  type="submit"
                  disabled={formsLocked || !canCloseSession || isClosurePending}
                >
                  {isClosurePending ? 'Closing...' : 'Close session'}
                </PrimaryButton>
                <SecondaryButton
                  type="button"
                  onClick={() => {
                    closeSessionForm.reset({
                      declaredCashAmount:
                        activeSession?.openingFloatAmount.toFixed(2) ?? '150.00'
                    });
                  }}
                >
                  Reset closure amount
                </SecondaryButton>
              </div>
            </form>
          </div>

          {activeSession?.status === 'CLOSED' ? (
            <div className="space-y-4 rounded-2xl border border-line/80 bg-stone-50 px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Session closure summary</p>
                  <p className="mt-1 text-sm text-muted">
                    {closureResult === null
                      ? 'Recovered from the local closed-session state.'
                      : `Closure event ${closureResult.eventPublicationStatus}.`}
                  </p>
                </div>
                <StatusPill
                  tone={
                    closureResult === null
                      ? 'neutral'
                      : resolveEventPublicationTone(closureResult.eventPublicationStatus)
                  }
                >
                  {closureResult?.eventPublicationStatus ?? 'Recovered locally'}
                </StatusPill>
              </div>

              <DefinitionList
                items={[
                  { label: 'Closed at', value: activeSession.closedAt === null ? 'Unavailable' : formatDateTime(activeSession.closedAt) },
                  { label: 'Declared cash', value: formatCurrency(activeSession.declaredCashAmount ?? 0) },
                  { label: 'Opening float', value: formatCurrency(activeSession.openingFloatAmount) },
                  { label: 'Register', value: activeSession.registerId }
                ]}
              />
            </div>
          ) : null}
        </div>
      </CheckoutFormCard>
  );
}
