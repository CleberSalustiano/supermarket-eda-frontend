import { describe, expect, it } from 'vitest';

import { themeTokens, type ThemeName, type ThemeTokenName } from '../design-tokens';
import { contrastRatio } from './contrast';

const contrastPairs: ReadonlyArray<readonly [ThemeTokenName, ThemeTokenName, number]> = [
  ['ink', 'floor', 4.5],
  ['ink', 'paper', 4.5],
  ['ink-muted', 'paper', 4.5],
  ['ink-muted', 'floor', 4.5],
  ['on-primary', 'primary', 4.5],
  ['on-tag', 'tag', 4.5],
  ['ink', 'tag-soft', 4.5],
  ['go', 'paper', 4.5],
  ['go', 'go-soft', 4.5],
  ['ink', 'go-soft', 4.5],
  ['stop', 'paper', 4.5],
  ['stop', 'stop-soft', 4.5],
  ['caution', 'caution-soft', 4.5],
  ['caution', 'paper', 4.5],
  ['on-danger', 'danger', 4.5],
  ['edge', 'paper', 3],
  ['edge', 'floor', 3],
  ['focus', 'floor', 3],
  ['focus', 'paper', 3]
];

describe('theme token contrast', () => {
  const themes: ThemeName[] = ['light', 'dark'];

  it.each(themes)('defines the same 20 tokens in the %s theme', (theme) => {
    expect(Object.keys(themeTokens[theme]).sort()).toEqual(Object.keys(themeTokens.light).sort());
    expect(Object.keys(themeTokens[theme])).toHaveLength(20);
  });

  for (const theme of themes) {
    for (const [fg, bg, minimum] of contrastPairs) {
      it(`${theme}: ${fg} on ${bg} is at least ${minimum}:1`, () => {
        expect(contrastRatio(themeTokens[theme][fg], themeTokens[theme][bg])).toBeGreaterThanOrEqual(minimum);
      });
    }
  }

  it('keeps the dark destructive button edge readable on paper', () => {
    expect(contrastRatio(themeTokens.dark.stop, themeTokens.dark.paper)).toBeGreaterThanOrEqual(3);
  });
});
