import type { ReactNode } from 'react';

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="font-display text-title text-ink">{children}</h1>;
}
