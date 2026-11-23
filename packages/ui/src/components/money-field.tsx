import { forwardRef, useId, type InputHTMLAttributes } from 'react';

import { useUiI18n } from '../i18n/ui-i18n';
import { controlClasses, describedBy, FieldShell, type FieldChromeProps } from './field-shell';
import { cn } from '../cn';

export interface MoneyFieldProps extends FieldChromeProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {}

export const MoneyField = forwardRef<HTMLInputElement, MoneyFieldProps>(function MoneyField(
  { label, hint, error, size = 'md', className, id, ...rest },
  ref
) {
  const generated = useId();
  const inputId = id ?? generated;
  const { fmt } = useUiI18n();
  return (
    <FieldShell id={inputId} label={label} hint={hint} error={error} className={className}>
      <div className="relative">
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-y-0 left-0 flex items-center text-ink-muted',
            size === 'lg' ? 'pl-4 text-body-lg' : 'pl-3 text-body'
          )}
        >
          {fmt.splitCurrency(0).symbol}
        </span>
        <input
          ref={ref}
          id={inputId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className={cn(controlClasses(size, error !== undefined), 'tabular-nums', size === 'lg' ? 'pl-12' : 'pl-10')}
          aria-invalid={error === undefined ? undefined : true}
          aria-describedby={describedBy(
            hint === undefined ? undefined : `${inputId}-hint`,
            error === undefined ? undefined : `${inputId}-error`
          )}
          {...rest}
        />
      </div>
    </FieldShell>
  );
});
