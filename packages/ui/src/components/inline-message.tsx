import type { ReactNode } from 'react';

import { cn } from '../cn';
import { useUiMessages } from '../i18n/ui-i18n';

export type InlineMessageTone = 'info' | 'success' | 'warning' | 'danger';

const toneClasses: Record<InlineMessageTone, string> = {
  info: 'bg-floor border-l-ink',
  success: 'bg-go-soft border-l-go',
  warning: 'bg-caution-soft border-l-caution',
  danger: 'bg-stop-soft border-l-stop'
};

export interface InlineMessageProps {
  tone: InlineMessageTone;
  title: string;
  detail?: string;
  supportCode?: string;
  children?: ReactNode;
}

export function InlineMessage({ tone, title, detail, supportCode, children }: InlineMessageProps) {
  const m = useUiMessages();
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex flex-col gap-1 rounded-control border-l-4 px-4 py-3 text-body text-ink', toneClasses[tone])}
    >
      <p className="font-bold">{title}</p>
      {detail === undefined ? null : <p className="text-small">{m.message.serverDetail({ message: detail })}</p>}
      {supportCode === undefined ? null : <p className="text-small">{m.message.supportCode({ id: supportCode })}</p>}
      {children}
    </div>
  );
}
