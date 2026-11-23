import { Button } from '@supermarket/frontend-ui';

interface MobileActionBarProps {
  label: string;
  shortcut: string;
  disabled: boolean;
  onAction: () => void;
}

/** Sticky bottom bar below 640px that repeats the current primary step. */
export function MobileActionBar({ label, shortcut, disabled, onAction }: MobileActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-paper p-3">
      <Button size="lg" shortcut={shortcut} disabled={disabled} className="w-full" onClick={onAction}>
        {label}
      </Button>
    </div>
  );
}
