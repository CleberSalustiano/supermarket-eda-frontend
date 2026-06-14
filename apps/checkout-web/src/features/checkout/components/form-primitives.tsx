import type { PropsWithChildren, ReactNode } from 'react';

import { StatusPill, cn } from '@supermarket/frontend-ui';

export function CheckoutFormCard({
  title,
  description,
  actionLabel,
  actionTone = 'neutral',
  children
}: PropsWithChildren<{
  title: string;
  description: string;
  actionLabel?: string;
  actionTone?: 'neutral' | 'success' | 'warning' | 'danger';
}>) {
  return (
    <section className="rounded-3xl border border-line bg-white/88 p-5 shadow-panel">
      <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold tracking-tight text-ink">{title}</h3>
          <p className="max-w-2xl text-sm leading-6 text-muted">{description}</p>
        </div>
        {actionLabel === undefined ? null : <StatusPill tone={actionTone}>{actionLabel}</StatusPill>}
      </header>
      {children}
    </section>
  );
}

export function FormField({
  label,
  hint,
  error,
  children
}: PropsWithChildren<{
  label: string;
  hint?: string;
  error?: string;
}>) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-ink">{label}</span>
        {hint === undefined ? null : <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
      {error === undefined ? null : <p className="text-sm text-danger">{error}</p>}
    </label>
  );
}

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-2xl border border-line bg-stone-50 px-4 text-sm text-ink outline-none transition',
        'placeholder:text-stone-400 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10',
        className
      )}
      {...props}
    />
  );
}

export function PrimaryButton({
  tone = 'accent',
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'accent' | 'neutral';
}) {
  return (
    <button
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition',
        tone === 'accent'
          ? 'bg-accent text-white shadow-[0_12px_30px_-18px_rgba(31,118,110,0.9)] hover:bg-accent/95 disabled:bg-accent/55'
          : 'bg-stone-900 text-white hover:bg-stone-800 disabled:bg-stone-500',
        'disabled:cursor-not-allowed',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-2xl border border-line bg-white px-5 text-sm font-semibold text-ink transition',
        'hover:border-accent/30 hover:bg-accentSoft disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function FeedbackBanner({
  tone,
  title,
  description,
  detail
}: {
  tone: 'success' | 'danger' | 'warning';
  title: string;
  description: string;
  detail?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-3',
        tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-900',
        tone === 'danger' && 'border-rose-200 bg-rose-50 text-rose-900',
        tone === 'warning' && 'border-amber-200 bg-amber-50 text-amber-900'
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm">{description}</p>
      {detail === undefined ? null : <p className="mt-2 font-mono text-xs opacity-80">{detail}</p>}
    </div>
  );
}

export function DefinitionList({
  items
}: {
  items: Array<{ label: string; value: string | number }>;
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-line/80 bg-stone-50 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{item.label}</dt>
          <dd className="mt-2 text-sm font-medium text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SectionIntro({
  icon,
  title,
  description
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="inline-flex rounded-2xl border border-accent/10 bg-accentSoft p-3 text-accent">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-tight text-ink">{title}</h3>
        <p className="text-sm leading-6 text-muted">{description}</p>
      </div>
    </div>
  );
}
