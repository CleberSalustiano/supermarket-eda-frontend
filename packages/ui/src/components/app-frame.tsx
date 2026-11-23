import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import { cn } from '../cn';
import { useUiMessages } from '../i18n/ui-i18n';
import { PreferencesMenu } from './preferences-menu';

export interface AppFrameNavItem {
  to: string;
  label: string;
}

export interface AppFrameProps {
  appName: string;
  topBarEnd?: ReactNode;
  nav?: ReadonlyArray<AppFrameNavItem>;
  banner?: ReactNode;
  children: ReactNode;
}

export function AppFrame({ appName, topBarEnd, nav, banner, children }: AppFrameProps) {
  const m = useUiMessages();
  return (
    <div className="flex min-h-screen flex-col bg-floor text-ink">
      <a
        href="#main-content"
        className="sr-only rounded-control bg-paper px-4 py-2 text-body font-bold text-ink focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50"
      >
        {m.skipLink}
      </a>
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-rule bg-paper px-4">
        <span className="font-display text-title text-ink">{appName}</span>
        <div className="flex items-center gap-3">
          {topBarEnd}
          <PreferencesMenu />
        </div>
      </header>
      {banner}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {nav === undefined || nav.length === 0 ? null : (
          <nav
            aria-label={appName}
            className="flex shrink-0 gap-1 overflow-x-auto border-b border-rule bg-paper px-2 lg:w-60 lg:flex-col lg:border-b-0 lg:border-r lg:px-0 lg:py-4"
          >
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex h-11 items-center border-l-4 px-4 text-body text-ink',
                    isActive ? 'border-ink font-bold' : 'border-transparent'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
        <main id="main-content" className="min-w-0 flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
