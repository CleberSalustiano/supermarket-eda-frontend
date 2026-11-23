import type { ReactNode } from 'react';

// Wide tables scroll inside this region, so the page itself never scrolls sideways on narrow screens.
export function ScrollRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="region" aria-label={label} tabIndex={0} className="max-w-full overflow-x-auto">
      {children}
    </div>
  );
}
