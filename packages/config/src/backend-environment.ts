export const frontendBackendEnvironmentKeys = {
  checkoutBaseUrl: 'FRONTEND_CHECKOUT_API_BASE_URL',
  inventoryBaseUrl: 'FRONTEND_INVENTORY_API_BASE_URL',
  managementBaseUrl: 'FRONTEND_MANAGEMENT_API_BASE_URL'
} as const;

export type FrontendBackendEnvironmentKey =
  (typeof frontendBackendEnvironmentKeys)[keyof typeof frontendBackendEnvironmentKeys];

