import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title: string;
  body: string;
  action?: ReactNode;
}

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div className="flex max-w-prose flex-col items-start gap-3 py-8">
      <h2 className="text-heading text-ink">{title}</h2>
      <p className="text-body text-ink-muted">{body}</p>
      {action}
    </div>
  );
}
