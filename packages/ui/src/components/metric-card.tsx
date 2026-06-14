import type { ReactNode } from 'react';

import { cn } from '../cn';

export function MetricCard({
  label,
  value,
  detail,
  icon,
  tone = 'default'
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone?: 'default' | 'accent';
}) {
  return (
    <div
      className={cn(
        'rounded-3xl border px-5 py-4',
        tone === 'accent'
          ? 'border-accent/20 bg-accentSoft text-ink'
          : 'border-line bg-white/85 text-ink'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white/75 p-3 text-accent">{icon}</div>
      </div>
    </div>
  );
}
