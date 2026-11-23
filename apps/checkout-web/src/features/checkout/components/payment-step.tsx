import { checkoutSalePaymentMethods } from '@supermarket/api-sdk';
import { Button, MoneyField, SegmentedControl } from '@supermarket/frontend-ui';

import { useI18n } from '../../../i18n';
import type { PaymentFormController } from '../hooks/use-payment-form';

export const PAYMENT_FORM_ID = 'payment-form';

interface PaymentStepProps {
  controller: PaymentFormController;
  total: number;
  isPending: boolean;
  /** False below 640px, where the sticky bottom bar already carries the primary action. */
  showPrimaryAction?: boolean;
}

export function PaymentStep({ controller, total, isPending, showPrimaryAction = true }: PaymentStepProps) {
  const { m, fmt } = useI18n();
  const { form, amountRegistration, paidAmount, isShort, submit, setExactAmount } = controller;
  const method = form.watch('paymentMethod');
  const isCash = method === 'CASH';
  const shortfall = isShort && paidAmount !== null ? total - paidAmount : 0;
  const change = paidAmount === null ? 0 : Math.max(0, paidAmount - total);
  const methodOptions = checkoutSalePaymentMethods.map((value) => ({
    value,
    label: m.payment.methods[value]
  }));

  return (
    <form
      id={PAYMENT_FORM_ID}
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <h2 className="text-heading text-ink">{m.payment.title}</h2>
      <SegmentedControl
        label={m.payment.method}
        options={methodOptions}
        value={method}
        onChange={(value) => {
          form.setValue('paymentMethod', value, { shouldDirty: true });
        }}
      />
      <div className="flex flex-col gap-2">
        <MoneyField
          size="lg"
          label={m.payment.received}
          error={form.formState.errors.paidAmount?.message}
          readOnly={!isCash}
          {...amountRegistration}
        />
        {isCash ? (
          <div>
            <Button variant="quiet" onClick={setExactAmount}>
              {m.payment.exact}
            </Button>
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-small font-bold text-ink">{m.payment.change}</span>
        <span className="font-display text-display-lg tabular-nums text-ink">{fmt.currency(change)}</span>
        {shortfall > 0 ? (
          <p role="status" className="text-body font-bold text-caution tabular-nums">
            {m.payment.short({ amount: fmt.currency(shortfall) })}
          </p>
        ) : null}
      </div>
      {showPrimaryAction ? (
        <div>
          <Button type="submit" size="lg" shortcut="F8" disabled={isPending || shortfall > 0}>
            {m.payment.submit}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
