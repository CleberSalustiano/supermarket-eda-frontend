import { cn } from '../cn';

export function StatusPill({
  tone,
  children
}: {
  tone: 'neutral' | 'success' | 'warning' | 'danger';
  children: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]',
        tone === 'neutral' && 'bg-stone-200 text-stone-700',
        tone === 'success' && 'bg-emerald-100 text-emerald-700',
        tone === 'warning' && 'bg-amber-100 text-amber-700',
        tone === 'danger' && 'bg-rose-100 text-rose-700'
      )}
    >
      {children}
    </span>
  );
}
