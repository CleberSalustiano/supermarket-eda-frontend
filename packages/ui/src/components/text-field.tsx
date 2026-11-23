import { forwardRef, useId, type InputHTMLAttributes } from 'react';

import { controlClasses, describedBy, FieldShell, type FieldChromeProps } from './field-shell';

export interface TextFieldProps extends FieldChromeProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, size = 'md', className, id, ...rest },
  ref
) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <FieldShell id={inputId} label={label} hint={hint} error={error} className={className}>
      <input
        ref={ref}
        id={inputId}
        className={controlClasses(size, error !== undefined)}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={describedBy(
          hint === undefined ? undefined : `${inputId}-hint`,
          error === undefined ? undefined : `${inputId}-error`
        )}
        {...rest}
      />
    </FieldShell>
  );
});
