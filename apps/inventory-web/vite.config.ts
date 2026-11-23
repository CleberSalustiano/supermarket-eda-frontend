import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'FRONTEND_'],
  publicDir: '../../packages/ui/public',
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts'
  }
});
