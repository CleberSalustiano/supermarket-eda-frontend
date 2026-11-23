// Local backend defaults belong to the mobile app only: web builds must never carry them.
const localServiceBaseUrls = {
  inventory: 'http://localhost:3002',
  management: 'http://localhost:3003'
} as const;

export const mobileServiceBaseUrls = {
  inventory:
    process.env.EXPO_PUBLIC_FRONTEND_INVENTORY_API_BASE_URL ?? localServiceBaseUrls.inventory,
  management:
    process.env.EXPO_PUBLIC_FRONTEND_MANAGEMENT_API_BASE_URL ?? localServiceBaseUrls.management
} as const;
