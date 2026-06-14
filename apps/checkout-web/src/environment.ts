import { defaultServiceBaseUrls } from '@supermarket/frontend-config';

export const checkoutServiceBaseUrl =
  typeof import.meta.env.FRONTEND_CHECKOUT_API_BASE_URL === 'string' &&
  import.meta.env.FRONTEND_CHECKOUT_API_BASE_URL.length > 0
    ? import.meta.env.FRONTEND_CHECKOUT_API_BASE_URL
    : defaultServiceBaseUrls.checkout;
