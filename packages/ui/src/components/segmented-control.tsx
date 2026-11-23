import { useId, useRef, type KeyboardEvent } from 'react';

import { cn } from '../cn';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  label: string;
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  className
}: SegmentedControlProps<T>) {
  const labelId = useId();
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );

  function move(index: number) {
    const next = (index + options.length) % options.length;
    const option = options[next];
    if (option !== undefined) {
      onChange(option.value);
      buttons.current[next]?.focus();
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      move(index + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      move(index - 1);
    }
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span id={labelId} className="text-small font-bold text-ink">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {options.map((option, index) => {
          const checked = index === selectedIndex;
          return (
            <button
              key={option.value}
              ref={(node) => {
                buttons.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                'h-11 rounded-control border px-4 text-body font-bold disabled:cursor-not-allowed disabled:opacity-40',
                checked ? 'border-transparent bg-primary text-on-primary' : 'border-edge bg-paper text-ink'
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
