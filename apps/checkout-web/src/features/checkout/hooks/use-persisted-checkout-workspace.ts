import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

import {
  checkoutWorkspaceStorageKey,
  createDefaultCheckoutWorkspaceState,
  parseCheckoutWorkspaceState,
  type CheckoutWorkspaceState
} from '../lib/workspace';

export function usePersistedCheckoutWorkspace(): [
  CheckoutWorkspaceState,
  Dispatch<SetStateAction<CheckoutWorkspaceState>>,
  () => void
] {
  const [workspace, setWorkspace] = useState<CheckoutWorkspaceState>(() => {
    if (typeof window === 'undefined') {
      return createDefaultCheckoutWorkspaceState();
    }

    return parseCheckoutWorkspaceState(
      window.localStorage.getItem(checkoutWorkspaceStorageKey)
    );
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(checkoutWorkspaceStorageKey, JSON.stringify(workspace));
  }, [workspace]);

  function resetWorkspace(): void {
    setWorkspace(createDefaultCheckoutWorkspaceState());
  }

  return [workspace, setWorkspace, resetWorkspace];
}
