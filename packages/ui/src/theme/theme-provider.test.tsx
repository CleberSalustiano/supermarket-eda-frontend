import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, useTheme } from './theme-provider';

type Listener = (event: MediaQueryListEvent) => void;

function mockMatchMedia(initialDark: boolean) {
  const listeners = new Set<Listener>();
  let dark = initialDark;
  vi.spyOn(window, 'matchMedia').mockImplementation(
    () =>
      ({
        get matches() {
          return dark;
        },
        addEventListener: (_: string, listener: Listener) => listeners.add(listener),
        removeEventListener: (_: string, listener: Listener) => listeners.delete(listener)
      }) as unknown as MediaQueryList
  );
  return (next: boolean) => {
    dark = next;
    listeners.forEach((listener) => listener({ matches: next } as MediaQueryListEvent));
  };
}

function Probe() {
  const { preference, resolved, setPreference } = useTheme();
  return (
    <div>
      <span data-testid="state">{`${preference}:${resolved}`}</span>
      <button onClick={() => setPreference('dark')}>dark</button>
      <button onClick={() => setPreference('light')}>light</button>
      <button onClick={() => setPreference('system')}>system</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('follows the system by default and tracks changes', () => {
    const emit = mockMatchMedia(false);
    render(<ThemeProvider><Probe /></ThemeProvider>);
    expect(screen.getByTestId('state')).toHaveTextContent('system:light');
    expect(document.documentElement.dataset.theme).toBe('light');

    act(() => emit(true));
    expect(screen.getByTestId('state')).toHaveTextContent('system:dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('switches, persists and ignores system changes while pinned', async () => {
    const emit = mockMatchMedia(false);
    const user = userEvent.setup();
    render(<ThemeProvider><Probe /></ThemeProvider>);

    await user.click(screen.getByText('dark'));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.dataset.themePreference).toBe('dark');
    expect(window.localStorage.getItem('supermarket.theme')).toBe('dark');

    act(() => emit(false));
    expect(screen.getByTestId('state')).toHaveTextContent('dark:dark');

    await user.click(screen.getByText('system'));
    expect(screen.getByTestId('state')).toHaveTextContent('system:light');
  });

  it('reads the stored preference on mount', () => {
    mockMatchMedia(false);
    window.localStorage.setItem('supermarket.theme', 'dark');
    render(<ThemeProvider><Probe /></ThemeProvider>);
    expect(screen.getByTestId('state')).toHaveTextContent('dark:dark');
  });

  it('keeps working when storage throws', async () => {
    mockMatchMedia(false);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    const user = userEvent.setup();
    render(<ThemeProvider><Probe /></ThemeProvider>);
    expect(screen.getByTestId('state')).toHaveTextContent('system:light');
    await user.click(screen.getByText('dark'));
    expect(screen.getByTestId('state')).toHaveTextContent('dark:dark');
  });
});
