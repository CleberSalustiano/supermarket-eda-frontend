import { cn } from '../cn';
import { useUiMessages } from '../i18n/ui-i18n';

export interface LaneLightProps {
  state: 'open' | 'closed';
  label: string;
}

export function LaneLight({ state, label }: LaneLightProps) {
  const m = useUiMessages();
  return (
    <span className="inline-flex items-center gap-2 text-body text-ink">
      <span
        aria-hidden="true"
        className={cn('inline-block h-3 w-3 rounded-full', state === 'open' ? 'bg-go' : 'bg-stop')}
      />
      <span className="font-bold">{label}</span>
      <span className={state === 'open' ? 'text-go' : 'text-stop'}>
        {state === 'open' ? m.laneLight.open : m.laneLight.closed}
      </span>
    </span>
  );
}
