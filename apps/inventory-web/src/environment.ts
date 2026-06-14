import { defaultServiceBaseUrls } from '@supermarket/frontend-config';

export const inventoryServiceBaseUrl =
  typeof import.meta.env.FRONTEND_INVENTORY_API_BASE_URL === 'string' &&
  import.meta.env.FRONTEND_INVENTORY_API_BASE_URL.length > 0
    ? import.meta.env.FRONTEND_INVENTORY_API_BASE_URL
    : defaultServiceBaseUrls.inventory;
