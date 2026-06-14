import { defaultServiceBaseUrls } from '@supermarket/frontend-config';

export const managementServiceBaseUrl =
  typeof import.meta.env.FRONTEND_MANAGEMENT_API_BASE_URL === 'string' &&
  import.meta.env.FRONTEND_MANAGEMENT_API_BASE_URL.length > 0
    ? import.meta.env.FRONTEND_MANAGEMENT_API_BASE_URL
    : defaultServiceBaseUrls.management;
