import { useEffect, useRef } from 'react';

export interface CashierShortcuts {
  canStartSale: boolean;
  canProcessPayment: boolean;
  canCompleteSale: boolean;
  canCancelSale: boolean;
  onStartSale: () => void;
  onPayment: () => void;
  onCompleteSale: () => void;
  onCancelSale: () => void;
  onEscape: () => void;
}

/**
 * Window-level key map: F2 new sale, F4 cancel sale, F8 payment, F9 complete sale, Esc back to the scanner.
 * Only handled keys have their default prevented, and nothing fires while a dialog is open
 * (the dialog owns Esc).
 */
export function useCashierShortcuts(shortcuts: CashierShortcuts): void {
  const latest = useRef(shortcuts);
  latest.current = shortcuts;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.defaultPrevented || isDialogOpen()) {
        return;
      }

      const current = latest.current;

      switch (event.key) {
        case 'F2':
          event.preventDefault();
          if (current.canStartSale) {
            current.onStartSale();
          }
          return;
        case 'F4':
          event.preventDefault();
          if (current.canCancelSale) {
            current.onCancelSale();
          }
          return;
        case 'F8':
          event.preventDefault();
          if (current.canProcessPayment) {
            current.onPayment();
          }
          return;
        case 'F9':
          event.preventDefault();
          if (current.canCompleteSale) {
            current.onCompleteSale();
          }
          return;
        case 'Escape':
          event.preventDefault();
          current.onEscape();
          return;
        default:
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}

function isDialogOpen(): boolean {
  return document.querySelector('dialog[open]') !== null;
}
