import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

import {
  checkoutWorkspaceStorageKey,
  createDefaultCheckoutWorkspaceState,
  parseCheckoutWorkspaceState,
  type CheckoutWorkspaceState
} from '../lib/workspace';

/** A blocked or full storage must never break the cashier screen, so every access is guarded. */
export function readStoredWorkspace(): string | null {
  try {
    return window.localStorage.getItem(checkoutWorkspaceStorageKey);
  } catch {
    return null;
  }
}

export function writeStoredWorkspace(workspace: CheckoutWorkspaceState): void {
  try {
    window.localStorage.setItem(checkoutWorkspaceStorageKey, JSON.stringify(workspace));
  } catch {
    // Persistence is best effort: the in-memory workspace keeps working.
  }
}

export function usePersistedCheckoutWorkspace(
  tenantId: string
): [CheckoutWorkspaceState, Dispatch<SetStateAction<CheckoutWorkspaceState>>, () => void] {
  const [workspace, setWorkspace] = useState<CheckoutWorkspaceState>(() => {
    if (typeof window === 'undefined') {
      return createDefaultCheckoutWorkspaceState();
    }

    return parseCheckoutWorkspaceState(readStoredWorkspace(), tenantId);
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    writeStoredWorkspace(workspace);
  }, [workspace]);

  function resetWorkspace(): void {
    setWorkspace(createDefaultCheckoutWorkspaceState());
  }

  return [workspace, setWorkspace, resetWorkspace];
}
