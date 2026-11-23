import { defineConfig } from 'cypress';

// Runs against the real local stack (`npm run local:up` from backend-services); nothing is stubbed.
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4101',
    specPattern: 'cypress/e2e-live/**/*.cy.ts',
    supportFile: false
  },
  video: false,
  screenshotOnRunFailure: false
});
