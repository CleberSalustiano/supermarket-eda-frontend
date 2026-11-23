const plugin = require('tailwindcss/plugin');
const tokens = require('./src/theme/tokens.json');

function toChannels(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

function variableBlock(theme) {
  const block = { 'color-scheme': theme };
  for (const [name, hex] of Object.entries(tokens[theme])) {
    block[`--color-${name}`] = toChannels(hex);
  }
  return block;
}

const variableColor = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

const tokenColors = Object.fromEntries(Object.keys(tokens.light).map((name) => [name, variableColor(name)]));

// Kept for operations-mobile until its redesign.
// NativeWind cannot read CSS variables at runtime: apps that need static values
// (operations-mobile) extend their colors with this block, derived from the light theme.
const legacyStaticColors = {
  canvas: tokens.light.floor,
  panel: tokens.light.paper,
  line: tokens.light.rule,
  muted: tokens.light['ink-muted'],
  accent: tokens.light.ink,
  accentSoft: tokens.light.floor,
  ink: tokens.light.ink
};

module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: tokenColors,
      fontFamily: {
        display: ['"Barlow Condensed"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Atkinson Hyperlegible Next"', '"Atkinson Hyperlegible"', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      fontSize: {
        'display-xl': ['72px', { lineHeight: '72px', fontWeight: '700' }],
        'display-lg': ['48px', { lineHeight: '52px', fontWeight: '700' }],
        'display-md': ['36px', { lineHeight: '40px', fontWeight: '600' }],
        title: ['24px', { lineHeight: '30px', fontWeight: '600' }],
        heading: ['21px', { lineHeight: '28px', fontWeight: '700' }],
        'body-lg': ['18px', { lineHeight: '28px' }],
        body: ['16px', { lineHeight: '24px' }],
        small: ['14px', { lineHeight: '20px' }]
      },
      borderRadius: {
        tag: '2px',
        control: '6px',
        pane: '8px'
      },
      boxShadow: {
        dialog: '0 12px 32px rgba(28, 43, 51, 0.24)'
      },
      keyframes: {
        'just-added': {
          from: { backgroundColor: 'rgb(var(--color-tag-soft))' },
          to: { backgroundColor: 'rgb(var(--color-paper))' }
        }
      },
      animation: {
        'just-added': 'just-added 1.2s ease-out 1'
      }
    }
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root, [data-theme="light"]': variableBlock('light'),
        '[data-theme="dark"]': variableBlock('dark'),
        html: {
          background: 'rgb(var(--color-floor))',
          color: 'rgb(var(--color-ink))',
          fontFamily: '"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", ui-sans-serif, system-ui, sans-serif'
        },
        ':focus-visible': {
          outline: '3px solid rgb(var(--color-focus))',
          'outline-offset': '2px'
        },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animation: 'none !important',
            transition: 'none !important'
          }
        }
      });
    })
  ],
  legacyStaticColors
};
