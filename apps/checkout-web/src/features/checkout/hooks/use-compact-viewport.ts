import { useSyncExternalStore } from 'react';

const COMPACT_QUERY = '(max-width: 639px)';

function subscribe(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') {
    return () => undefined;
  }

  const query = window.matchMedia(COMPACT_QUERY);
  query.addEventListener('change', onChange);

  return () => {
    query.removeEventListener('change', onChange);
  };
}

function getSnapshot(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(COMPACT_QUERY).matches;
}

/** True below 640px, where the cashier screen uses the sticky total and the bottom action bar. */
export function useCompactViewport(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
