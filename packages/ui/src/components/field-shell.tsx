import type { ReactNode } from 'react';

import { cn } from '../cn';

export type FieldSize = 'md' | 'lg';

export interface FieldChromeProps {
  label: string;
  hint?: string;
  error?: string;
  size?: FieldSize;
}

export const controlClasses = (size: FieldSize, invalid: boolean) =>
  cn(
    'w-full rounded-control border bg-paper text-ink placeholder:text-ink-muted disabled:cursor-not-allowed disabled:opacity-40',
    size === 'lg' ? 'h-14 px-4 text-body-lg' : 'h-11 px-3 text-body',
    invalid ? 'border-stop' : 'border-edge'
  );

export function describedBy(hintId: string | undefined, errorId: string | undefined): string | undefined {
  const ids = [hintId, errorId].filter((id): id is string => id !== undefined);
  return ids.length === 0 ? undefined : ids.join(' ');
}

export function FieldShell({
  id,
  label,
  hint,
  error,
  children,
  className
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="text-small font-bold text-ink">
        {label}
      </label>
      {children}
      {hint === undefined ? null : (
        <p id={`${id}-hint`} className="text-small text-ink-muted">
          {hint}
        </p>
      )}
      {error === undefined ? null : (
        <p id={`${id}-error`} role="alert" className="text-small text-stop">
          {error}
        </p>
      )}
    </div>
  );
}
