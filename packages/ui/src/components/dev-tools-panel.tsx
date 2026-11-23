import { useId, useState, type ReactNode } from 'react';

import { useDevToolsMessages } from '../dev-tools/dev-tools-messages';

export { useDevToolsMessages };

export function DevToolsPanel({ children }: { children: ReactNode }) {
  const m = useDevToolsMessages();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div className="fixed bottom-2 left-2 z-40 flex flex-col items-start gap-2">
      {open ? (
        <section id={panelId} aria-label={m.title} className="w-[360px] max-w-[calc(100vw-1rem)] rounded-pane border border-edge bg-paper p-4 text-ink">
          {children}
        </section>
      ) : null}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="rounded-control border border-transparent px-2 py-1 text-small text-ink-muted hover:underline"
      >
        {m.title}
      </button>
    </div>
  );
}
