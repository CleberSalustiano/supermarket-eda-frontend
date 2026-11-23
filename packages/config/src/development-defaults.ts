/**
 * Local seed values from backend-services/scripts/local-stack/seed-data.json.
 * Never used in production: web apps pass these only behind a static
 * `import.meta.env.MODE !== 'production'` guard so bundlers drop them from production builds.
 */
export const developmentDefaults = {
  tenantId: '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1',
  serviceBaseUrls: {
    checkout: 'http://localhost:3001',
    inventory: 'http://localhost:3002',
    management: 'http://localhost:3003'
  },
  checkoutRegisterId: 'register-01',
  developmentOperatorId: '2b6b69a3-1c2e-442e-928a-8f0614aa7d0e'
} as const;

export type DevelopmentDefaults = typeof developmentDefaults;
