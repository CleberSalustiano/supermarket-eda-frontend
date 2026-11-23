import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const source = readFileSync(join(process.cwd(), 'public', 'theme-init.js'), 'utf8');

function stubEnvironment(options: { stored?: string | null; throws?: boolean; prefersDark?: boolean }) {
  const getItem = vi.fn(() => {
    if (options.throws) {
      throw new Error('storage disabled');
    }
    return options.stored ?? null;
  });
  vi.stubGlobal('localStorage', { getItem, setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() });
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) => ({ matches: options.prefersDark === true, media: query }) as MediaQueryList
  );
  return getItem;
}

function runInit() {
  new Function(source)();
}

describe('theme-init.js', () => {
  beforeEach(() => {
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.themePreference;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('uses a stored light preference even when the system is dark', () => {
    stubEnvironment({ stored: 'light', prefersDark: true });
    runInit();
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.dataset.themePreference).toBe('light');
  });

  it('uses a stored dark preference', () => {
    stubEnvironment({ stored: 'dark', prefersDark: false });
    runInit();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.dataset.themePreference).toBe('dark');
  });

  it.each([
    [true, 'dark'],
    [false, 'light']
  ])('resolves the system preference (prefers dark: %s) to %s', (prefersDark, expected) => {
    stubEnvironment({ stored: 'system', prefersDark });
    runInit();
    expect(document.documentElement.dataset.theme).toBe(expected);
    expect(document.documentElement.dataset.themePreference).toBe('system');
  });

  it('defaults to system when nothing or garbage is stored', () => {
    stubEnvironment({ stored: 'purple', prefersDark: true });
    runInit();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.dataset.themePreference).toBe('system');
  });

  it('falls back to system when localStorage throws', () => {
    stubEnvironment({ throws: true, prefersDark: true });
    runInit();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.dataset.themePreference).toBe('system');
  });
});
