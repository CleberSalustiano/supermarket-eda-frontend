import { Button } from '@supermarket/frontend-ui';

import { useI18n } from '../../../i18n';

interface NextStepProps {
  /** `no-sale`: prompt plus new sale; `settled`: new sale only (a receipt or summary is above); `empty-cart`: scan prompt. */
  state: 'no-sale' | 'settled' | 'empty-cart';
  canStartSale: boolean;
  isStarting: boolean;
  onStartSale: () => void;
  /** False below 640px, where the sticky bottom bar already carries the primary action. */
  showPrimaryAction?: boolean;
}

/** The single, plain-language next action for states that have no dedicated step. */
export function NextStep({ state, canStartSale, isStarting, onStartSale, showPrimaryAction = true }: NextStepProps) {
  const { m } = useI18n();

  if (state === 'empty-cart') {
    return <p className="text-body text-ink">{m.next.emptyCart}</p>;
  }

  return (
    <div className="flex flex-col items-start gap-3">
      {state === 'no-sale' ? <p className="text-body text-ink">{m.next.noSale}</p> : null}
      {showPrimaryAction ? (
        <Button size="lg" shortcut="F2" disabled={!canStartSale || isStarting} onClick={onStartSale}>
          {m.next.newSale}
        </Button>
      ) : null}
    </div>
  );
}
