export const frontendBackendEnvironmentKeys = {
  checkoutBaseUrl: 'FRONTEND_CHECKOUT_API_BASE_URL',
  inventoryBaseUrl: 'FRONTEND_INVENTORY_API_BASE_URL',
  managementBaseUrl: 'FRONTEND_MANAGEMENT_API_BASE_URL'
} as const;

export type FrontendBackendEnvironmentKey =
  (typeof frontendBackendEnvironmentKeys)[keyof typeof frontendBackendEnvironmentKeys];

export const defaultServiceBaseUrls = {
  checkout: 'http://localhost:3001',
  inventory: 'http://localhost:3002',
  management: 'http://localhost:3003'
} as const;

export type FrontendServiceName = keyof typeof defaultServiceBaseUrls;

export const serviceEnvironmentKeyMap: Record<FrontendServiceName, FrontendBackendEnvironmentKey> =
  {
  checkout: frontendBackendEnvironmentKeys.checkoutBaseUrl,
  inventory: frontendBackendEnvironmentKeys.inventoryBaseUrl,
  management: frontendBackendEnvironmentKeys.managementBaseUrl
  };

export function resolveServiceBaseUrl(
  service: FrontendServiceName,
  overrides: Partial<Record<FrontendServiceName, string>> = {}
): string {
  const override = overrides[service];

  return override !== undefined && override.trim().length > 0
    ? override
    : defaultServiceBaseUrls[service];
}
