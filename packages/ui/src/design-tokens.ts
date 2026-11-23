import tokens from './theme/tokens.json';

export type ThemeName = 'light' | 'dark';
export type ThemeTokenName = keyof (typeof tokens)['light'];
export type ThemeTokens = Record<ThemeTokenName, string>;

export const themeTokens: Record<ThemeName, ThemeTokens> = tokens;

export const designTokens = {
  colors: themeTokens.light,
  spacing: {
    section: '1.5rem',
    panel: '1.25rem'
  }
} as const;
