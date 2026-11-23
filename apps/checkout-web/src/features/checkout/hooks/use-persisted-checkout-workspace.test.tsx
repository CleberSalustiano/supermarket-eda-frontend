import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { checkoutWorkspaceStorageKey, createDefaultCheckoutWorkspaceState } from '../lib/workspace';
import { usePersistedCheckoutWorkspace } from './use-persisted-checkout-workspace';

const tenantId = '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1';

describe('usePersistedCheckoutWorkspace', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('keeps working in memory when setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    const { result } = renderHook(() => usePersistedCheckoutWorkspace(tenantId));

    act(() => {
      result.current[1]((current) => ({ ...current }));
    });

    expect(result.current[0]).toEqual(createDefaultCheckoutWorkspaceState());
  });

  it('starts from the default workspace when getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });

    const { result } = renderHook(() => usePersistedCheckoutWorkspace(tenantId));

    expect(result.current[0]).toEqual(createDefaultCheckoutWorkspaceState());
  });

  it('persists the workspace when storage works', () => {
    renderHook(() => usePersistedCheckoutWorkspace(tenantId));

    expect(window.localStorage.getItem(checkoutWorkspaceStorageKey)).not.toBeNull();
  });
});
