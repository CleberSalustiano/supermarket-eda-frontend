import { useEffect, useMemo } from 'react';

import { Button, Dialog, InlineMessage, TextField } from '@supermarket/frontend-ui';
import { useForm } from 'react-hook-form';

import { useI18n } from '../../../i18n';
import type { CashierFeedback } from '../hooks/use-cashier-actions';
import { submitSchemaValidatedForm } from '../lib/form-validation';
import {
  createCancelSaleSchema,
  MAX_MANAGER_EMPLOYEE_CODE_LENGTH,
  MAX_MANAGER_PIN_LENGTH,
  type CancelSaleFormValues
} from '../schemas/checkout-forms';

const FORM_ID = 'cancel-sale-form';
const EMPTY_VALUES: CancelSaleFormValues = { reason: '', managerEmployeeCode: '', managerPin: '' };

interface CancelSaleDialogProps {
  open: boolean;
  requiresManagerApproval: boolean;
  isPending: boolean;
  feedback: CashierFeedback | null;
  /** Increments on every rejected, locked or unavailable approval, so the PIN is cleared and refocused. */
  approvalFailureCount: number;
  onClose: () => void;
  onConfirm: (values: CancelSaleFormValues) => void;
}

export function CancelSaleDialog({
  open,
  requiresManagerApproval,
  isPending,
  feedback,
  approvalFailureCount,
  onClose,
  onConfirm
}: CancelSaleDialogProps) {
  const { m } = useI18n();
  const schema = useMemo(() => createCancelSaleSchema(m, requiresManagerApproval), [m, requiresManagerApproval]);
  const form = useForm<CancelSaleFormValues>({ defaultValues: EMPTY_VALUES });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) {
      form.reset(EMPTY_VALUES);
    }
    // Each closing clears the form, so the next opening starts clean without racing the user's typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (approvalFailureCount > 0) {
      form.setValue('managerPin', '');
      form.setFocus('managerPin');
    }
    // Only a new approval failure should clear the PIN; the code and the reason stay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvalFailureCount]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={m.cancel.title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {m.cancel.back}
          </Button>
          <Button type="submit" form={FORM_ID} variant="danger" disabled={isPending}>
            {m.cancel.confirm}
          </Button>
        </>
      }
    >
      <p className="text-body text-ink">{m.cancel.body}</p>
      {feedback === null ? null : (
        <InlineMessage
          tone={feedback.tone}
          title={feedback.title}
          detail={feedback.detail}
          supportCode={feedback.supportCode}
        />
      )}
      <form
        id={FORM_ID}
        className="flex flex-col gap-4"
        noValidate
        onSubmit={form.handleSubmit((values) => {
          submitSchemaValidatedForm(form, schema, values, onConfirm);
        })}
      >
        <TextField
          label={m.cancel.reason}
          error={errors.reason?.message}
          autoComplete="off"
          maxLength={255}
          {...form.register('reason')}
        />
        {requiresManagerApproval && open ? (
          <>
            <TextField
              label={m.cancel.managerCode}
              hint={m.cancel.managerHint}
              error={errors.managerEmployeeCode?.message}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={MAX_MANAGER_EMPLOYEE_CODE_LENGTH}
              {...form.register('managerEmployeeCode')}
            />
            <TextField
              label={m.cancel.managerPin}
              error={errors.managerPin?.message}
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={MAX_MANAGER_PIN_LENGTH}
              {...form.register('managerPin')}
            />
          </>
        ) : null}
      </form>
    </Dialog>
  );
}
