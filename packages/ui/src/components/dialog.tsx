import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Dialog({ open, onClose, title, children, footer }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) {
      return;
    }
    if (open && !dialog.hasAttribute('open')) {
      dialog.showModal();
    } else if (!open && dialog.hasAttribute('open')) {
      dialog.close();
    }
  }, [open]);

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="w-full max-w-md rounded-pane border border-edge bg-paper p-6 text-ink backdrop:bg-ink/50 [[data-theme=light]_&]:shadow-dialog"
    >
      <div className="flex flex-col gap-4">
        <h2 id={titleId} className="text-heading text-ink">
          {title}
        </h2>
        {children}
        {footer === undefined ? null : <div className="flex justify-between gap-3 pt-2">{footer}</div>}
      </div>
    </dialog>
  );
}
