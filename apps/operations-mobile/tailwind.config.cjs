const preset = require('../../packages/ui/tailwind-preset.cjs');
const nativewind = require('nativewind/preset');

module.exports = {
  presets: [preset, nativewind],
  // NativeWind cannot read the web theme's CSS variables, so mobile uses the static light values.
  theme: {
    extend: {
      colors: preset.legacyStaticColors
    }
  },
  content: [
    './App.tsx',
    './src/**/*.{ts,tsx}'
  ]
};
