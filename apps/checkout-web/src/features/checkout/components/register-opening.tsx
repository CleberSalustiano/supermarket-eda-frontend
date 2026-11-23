import { useMemo } from 'react';

import type { CheckoutPosSession } from '@supermarket/api-sdk';
import type { FrontendRuntimeConfig } from '@supermarket/frontend-config';
import { Button, InlineMessage, MoneyField, TextField } from '@supermarket/frontend-ui';
import { useForm } from 'react-hook-form';

import { useI18n } from '../../../i18n';
import type { CashierFeedback, OpenSessionInput } from '../hooks/use-cashier-actions';
import { formatDecimalInput } from '../lib/decimal-input';
import { submitSchemaValidatedForm } from '../lib/form-validation';
import { createOpenSessionSchema, type OpenSessionFormValues } from '../schemas/checkout-forms';

const DEFAULT_OPENING_FLOAT = 150;

interface RegisterOpeningProps {
  config: FrontendRuntimeConfig;
  closedSession: CheckoutPosSession | null;
  feedback: CashierFeedback | null;
  isPending: boolean;
  onOpen: (input: OpenSessionInput) => void;
}

export function RegisterOpening({
  config,
  closedSession,
  feedback,
  isPending,
  onOpen
}: RegisterOpeningProps) {
  const { m, fmt } = useI18n();
  const schema = useMemo(() => createOpenSessionSchema(m, fmt), [m, fmt]);
  const fixedRegisterId = config.checkoutRegisterId;
  const form = useForm<OpenSessionFormValues>({
    defaultValues: {
      registerId: fixedRegisterId ?? '',
      operatorId: config.developmentOperatorId ?? '',
      openingFloatAmount: formatDecimalInput(DEFAULT_OPENING_FLOAT, fmt)
    }
  });
  const { errors } = form.formState;

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-6 py-6">
      <h1 className="font-display text-title text-ink">{m.open.title}</h1>

      {closedSession === null || closedSession.closedAt === null ? null : (
        <InlineMessage
          tone="success"
          title={m.open.closedSummary({
            id: closedSession.registerId,
            time: fmt.time(closedSession.closedAt),
            amount: fmt.currency(closedSession.declaredCashAmount ?? 0)
          })}
        />
      )}

      {feedback === null ? null : (
        <InlineMessage
          tone={feedback.tone}
          title={feedback.title}
          detail={feedback.detail}
          supportCode={feedback.supportCode}
        />
      )}

      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={form.handleSubmit((values) => {
          submitSchemaValidatedForm(form, schema, values, (parsed) => {
            const openingFloatAmount = fmt.parseDecimal(parsed.openingFloatAmount);

            if (openingFloatAmount === null) {
              form.setError('openingFloatAmount', { type: 'manual', message: m.validation.money });
              return;
            }

            onOpen({
              registerId: parsed.registerId,
              operatorId: parsed.operatorId,
              openingFloatAmount
            });
          });
        })}
      >
        {fixedRegisterId === null ? (
          <TextField
            size="lg"
            label={m.open.register}
            error={errors.registerId?.message}
            {...form.register('registerId')}
          />
        ) : (
          <div className="flex flex-col gap-1">
            <span className="text-small font-bold text-ink">{m.open.register}</span>
            <p className="text-body-lg text-ink">{fixedRegisterId}</p>
          </div>
        )}
        <TextField
          size="lg"
          label={m.open.operator}
          hint={m.open.operatorHint}
          error={errors.operatorId?.message}
          autoComplete="off"
          spellCheck={false}
          {...form.register('operatorId')}
        />
        <MoneyField
          size="lg"
          label={m.open.float}
          error={errors.openingFloatAmount?.message}
          {...form.register('openingFloatAmount')}
        />
        <div>
          <Button type="submit" size="lg" disabled={isPending}>
            {m.open.submit}
          </Button>
        </div>
      </form>
    </div>
  );
}
