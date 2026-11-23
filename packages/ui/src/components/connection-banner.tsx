import { useUiMessages } from '../i18n/ui-i18n';
import { Button } from './button';

export interface ConnectionBannerProps {
  service: 'checkout' | 'management' | 'inventory';
  onRetry: () => void;
}

export function ConnectionBanner({ service, onRetry }: ConnectionBannerProps) {
  const m = useUiMessages();
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-caution bg-caution-soft px-4 py-2 text-body text-ink"
    >
      <p>{m.connection.banner({ service: m.connection.service[service] })}</p>
      <Button variant="secondary" onClick={onRetry}>
        {m.connection.retry}
      </Button>
    </div>
  );
}
