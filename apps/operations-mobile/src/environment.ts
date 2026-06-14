import { defaultServiceBaseUrls } from '@supermarket/frontend-config';

export const mobileServiceBaseUrls = {
  inventory:
    process.env.EXPO_PUBLIC_FRONTEND_INVENTORY_API_BASE_URL ?? defaultServiceBaseUrls.inventory,
  management:
    process.env.EXPO_PUBLIC_FRONTEND_MANAGEMENT_API_BASE_URL ?? defaultServiceBaseUrls.management
} as const;
