import type { ReactNode } from 'react';

import { cn } from '../cn';

export function KeyCap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center rounded-control border border-edge px-1.5 font-sans text-small font-bold',
        className
      )}
    >
      {children}
    </kbd>
  );
}
