import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

import { cn } from '../cn';

export interface PopoverProps {
  triggerLabel: string;
  triggerIcon: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Popover({ triggerLabel, triggerIcon, children, className }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onPointerDown(event: MouseEvent) {
      if (event.target instanceof Node && containerRef.current?.contains(event.target) !== true) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={triggerLabel}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-control border border-edge bg-paper text-ink"
      >
        {triggerIcon}
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute right-0 top-full z-20 mt-2 w-72 rounded-pane border border-edge bg-paper p-4 text-ink"
      >
        {open ? children : null}
      </div>
    </div>
  );
}
