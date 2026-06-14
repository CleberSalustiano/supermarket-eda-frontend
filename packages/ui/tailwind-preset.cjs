const colors = {
  canvas: '#f5f5f4',
  panel: '#fdfcfb',
  ink: '#1f2937',
  muted: '#6b7280',
  line: '#d6d3d1',
  accent: '#1f766e',
  accentSoft: '#d9f0eb',
  success: '#166534',
  warning: '#a16207',
  danger: '#b91c1c'
};

module.exports = {
  theme: {
    extend: {
      colors,
      fontFamily: {
        sans: ['"Manrope"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        panel: '0 16px 40px -24px rgba(17, 24, 39, 0.28)'
      },
      backgroundImage: {
        grid: 'linear-gradient(to right, rgba(214, 211, 209, 0.32) 1px, transparent 1px), linear-gradient(to bottom, rgba(214, 211, 209, 0.32) 1px, transparent 1px)'
      },
      backgroundSize: {
        grid: '32px 32px'
      },
      borderRadius: {
        panel: '1.5rem'
      }
    }
  }
};
