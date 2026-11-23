import { useState, type RefObject } from 'react';

import type { CheckoutCatalogItem } from '@supermarket/api-sdk';
import { Button, InlineMessage, PriceTag, TextField } from '@supermarket/frontend-ui';

import { useI18n } from '../../../i18n';
import type { CashierFeedback } from '../hooks/use-cashier-actions';
import { parseScanInput } from '../lib/scan-input';

interface ScannerProps {
  inputRef: RefObject<HTMLInputElement | null>;
  enabled: boolean;
  isBusy: boolean;
  preview: CheckoutCatalogItem | null;
  feedback: CashierFeedback | null;
  onAdd: (barcode: string, quantity: number) => void;
  onPriceCheck: (barcode: string) => void;
}

export function Scanner({
  inputRef,
  enabled,
  isBusy,
  preview,
  feedback,
  onAdd,
  onPriceCheck
}: ScannerProps) {
  const { m } = useI18n();
  const [text, setText] = useState('');
  const [formatError, setFormatError] = useState(false);

  function submit(action: 'add' | 'check'): void {
    if (text.trim().length === 0) {
      return;
    }

    const result = parseScanInput(text);

    if (!result.ok) {
      setFormatError(true);
      return;
    }

    setFormatError(false);
    setText('');

    if (action === 'add') {
      onAdd(result.barcode, result.quantity);
    } else {
      onPriceCheck(result.barcode);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          submit('add');
        }}
      >
        <TextField
          ref={inputRef}
          size="lg"
          className="flex-1"
          label={m.scanner.label}
          hint={m.scanner.hint}
          error={formatError ? m.scanner.formatError : undefined}
          placeholder={enabled ? undefined : m.scanner.disabledPlaceholder}
          disabled={!enabled}
          autoComplete="off"
          spellCheck={false}
          inputMode="numeric"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setFormatError(false);
          }}
        />
        <Button
          variant="secondary"
          size="lg"
          disabled={!enabled || isBusy}
          onClick={() => {
            submit('check');
          }}
        >
          {m.scanner.priceCheck}
        </Button>
      </form>

      {feedback === null ? null : (
        <InlineMessage
          tone={feedback.tone}
          title={feedback.title}
          detail={feedback.detail}
          supportCode={feedback.supportCode}
        />
      )}

      {preview === null ? null : (
        <div className="flex items-center gap-4">
          <PriceTag size="md" value={preview.unitPrice} label={preview.name} />
          <p className="text-body-lg text-ink">{preview.name}</p>
        </div>
      )}
    </div>
  );
}
