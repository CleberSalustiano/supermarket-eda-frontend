export const frontendBackendEnvironmentKeys = {
  checkoutBaseUrl: 'FRONTEND_CHECKOUT_API_BASE_URL',
  inventoryBaseUrl: 'FRONTEND_INVENTORY_API_BASE_URL',
  managementBaseUrl: 'FRONTEND_MANAGEMENT_API_BASE_URL'
} as const;

export type FrontendBackendEnvironmentKey =
  (typeof frontendBackendEnvironmentKeys)[keyof typeof frontendBackendEnvironmentKeys];

export type FrontendServiceName = 'checkout' | 'inventory' | 'management';

export const serviceEnvironmentKeyMap: Record<FrontendServiceName, FrontendBackendEnvironmentKey> =
  {
  checkout: frontendBackendEnvironmentKeys.checkoutBaseUrl,
  inventory: frontendBackendEnvironmentKeys.inventoryBaseUrl,
  management: frontendBackendEnvironmentKeys.managementBaseUrl
  };

/** Services have no built-in URL: every caller supplies the base URL from its own configuration. */
export function resolveServiceBaseUrl(
  service: FrontendServiceName,
  overrides: Partial<Record<FrontendServiceName, string>> = {}
): string {
  const override = overrides[service];

  if (override === undefined || override.trim().length === 0) {
    throw new Error(`No base URL configured for the ${service} service.`);
  }

  return override;
}
