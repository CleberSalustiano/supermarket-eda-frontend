import { forwardRef, useId, type SelectHTMLAttributes } from 'react';

import { controlClasses, describedBy, FieldShell, type FieldChromeProps } from './field-shell';

export interface SelectFieldProps extends FieldChromeProps, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, hint, error, size = 'md', className, id, children, ...rest },
  ref
) {
  const generated = useId();
  const selectId = id ?? generated;
  return (
    <FieldShell id={selectId} label={label} hint={hint} error={error} className={className}>
      <select
        ref={ref}
        id={selectId}
        className={controlClasses(size, error !== undefined)}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={describedBy(
          hint === undefined ? undefined : `${selectId}-hint`,
          error === undefined ? undefined : `${selectId}-error`
        )}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
});
