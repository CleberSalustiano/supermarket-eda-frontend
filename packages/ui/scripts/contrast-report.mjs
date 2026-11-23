// Dev-only tooling: prints the WCAG contrast table for both themes. Never imported by app code.
import { readFileSync } from 'node:fs';

const tokens = JSON.parse(readFileSync(new URL('../src/theme/tokens.json', import.meta.url), 'utf8'));

const pairs = [
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

function channel(v) {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

function ratio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

let failed = false;
for (const theme of ['light', 'dark']) {
  console.log(`\n${theme} theme`);
  console.log('pair'.padEnd(28) + 'ratio'.padEnd(8) + 'min'.padEnd(6) + 'result');
  for (const [fg, bg, min] of pairs) {
    const r = ratio(tokens[theme][fg], tokens[theme][bg]);
    const ok = r >= min;
    failed = failed || !ok;
    console.log(`${fg} / ${bg}`.padEnd(28) + r.toFixed(1).padEnd(8) + String(min).padEnd(6) + (ok ? 'ok' : 'FAIL'));
  }
}
process.exit(failed ? 1 : 0);
