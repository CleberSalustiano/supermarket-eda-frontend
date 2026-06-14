import type { PropsWithChildren, ReactNode } from 'react';

import { cn } from '../cn';

export interface AppShellNavigationItem {
  label: string;
  description: string;
}

interface AppShellProps extends PropsWithChildren {
  eyebrow: string;
  title: string;
  description: string;
  navigationItems: AppShellNavigationItem[];
  sidebarFooter?: ReactNode;
}

export function AppShell({
  eyebrow,
  title,
  description,
  navigationItems,
  sidebarFooter,
  children
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[19rem_minmax(0,1fr)] lg:px-6">
        <aside className="relative overflow-hidden rounded-panel border border-line bg-panel shadow-panel">
          <div className="absolute inset-0 bg-grid opacity-50" />
          <div className="relative flex h-full flex-col justify-between p-6">
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="inline-flex rounded-full border border-accent/15 bg-accentSoft px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                  {eyebrow}
                </span>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-ink">{title}</h1>
                  <p className="max-w-sm text-sm leading-6 text-muted">{description}</p>
                </div>
              </div>
              <nav className="space-y-3">
                {navigationItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-line/80 bg-white/70 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-ink">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-muted">{item.description}</p>
                  </div>
                ))}
              </nav>
            </div>
            {sidebarFooter === undefined ? null : <div className="pt-6">{sidebarFooter}</div>}
          </div>
        </aside>
        <main className="min-w-0 py-1">{children}</main>
      </div>
    </div>
  );
}

export function AppSection({
  title,
  description,
  children,
  className
}: PropsWithChildren<{
  title: string;
  description: string;
  className?: string;
}>) {
  return (
    <section className={cn('rounded-panel border border-line bg-panel p-6 shadow-panel', className)}>
      <header className="mb-5 space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-ink">{title}</h2>
        <p className="text-sm leading-6 text-muted">{description}</p>
      </header>
      {children}
    </section>
  );
}
