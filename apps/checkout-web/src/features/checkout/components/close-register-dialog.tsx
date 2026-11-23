import { useEffect, useMemo } from 'react';

import { Button, Dialog, InlineMessage, MoneyField } from '@supermarket/frontend-ui';
import { useForm } from 'react-hook-form';

import { useI18n } from '../../../i18n';
import type { CashierFeedback, CloseSessionInput } from '../hooks/use-cashier-actions';
import { formatDecimalInput } from '../lib/decimal-input';
import { submitSchemaValidatedForm } from '../lib/form-validation';
import { createCloseSessionSchema, type CloseSessionFormValues } from '../schemas/checkout-forms';

const FORM_ID = 'close-register-form';

interface CloseRegisterDialogProps {
  open: boolean;
  canClose: boolean;
  openingFloat: number;
  isPending: boolean;
  feedback: CashierFeedback | null;
  onClose: () => void;
  onConfirm: (input: CloseSessionInput) => void;
}

export function CloseRegisterDialog({
  open,
  canClose,
  openingFloat,
  isPending,
  feedback,
  onClose,
  onConfirm
}: CloseRegisterDialogProps) {
  const { m, fmt } = useI18n();
  const schema = useMemo(() => createCloseSessionSchema(m, fmt), [m, fmt]);
  const form = useForm<CloseSessionFormValues>({
    defaultValues: { declaredCashAmount: formatDecimalInput(openingFloat, fmt) }
  });

  useEffect(() => {
    if (!open) {
      form.reset({ declaredCashAmount: formatDecimalInput(openingFloat, fmt) });
    }
    // The counted cash defaults to the opening float each time the dialog is closed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={m.close.title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {m.close.back}
          </Button>
          <Button type="submit" form={FORM_ID} disabled={!canClose || isPending}>
            {m.close.confirm}
          </Button>
        </>
      }
    >
      {canClose ? null : <InlineMessage tone="warning" title={m.close.blocked} />}
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
          submitSchemaValidatedForm(form, schema, values, (parsed) => {
            const declaredCashAmount = fmt.parseDecimal(parsed.declaredCashAmount);

            if (declaredCashAmount === null) {
              form.setError('declaredCashAmount', { type: 'manual', message: m.validation.money });
              return;
            }

            onConfirm({ declaredCashAmount });
          });
        })}
      >
        <MoneyField
          label={m.close.counted}
          error={form.formState.errors.declaredCashAmount?.message}
          disabled={!canClose}
          {...form.register('declaredCashAmount')}
        />
      </form>
    </Dialog>
  );
}
