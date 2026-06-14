import type { ReactNode } from 'react';

export function ActionCard({
  title,
  description,
  icon,
  footer
}: {
  title: string;
  description: string;
  icon: ReactNode;
  footer: string;
}) {
  return (
    <article className="rounded-3xl border border-line bg-white/85 p-5">
      <div className="mb-4 inline-flex rounded-2xl border border-accent/10 bg-accentSoft p-3 text-accent">
        {icon}
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      <p className="mt-4 text-xs font-medium uppercase tracking-[0.22em] text-muted">{footer}</p>
    </article>
  );
}
