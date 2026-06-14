const preset = require('../../packages/ui/tailwind-preset.cjs');
const nativewind = require('nativewind/preset');

module.exports = {
  presets: [preset, nativewind],
  content: [
    './App.tsx',
    './src/**/*.{ts,tsx}'
  ]
};
