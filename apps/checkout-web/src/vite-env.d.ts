/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly FRONTEND_TENANT_ID?: string;
  readonly FRONTEND_CHECKOUT_API_BASE_URL?: string;
  readonly FRONTEND_INVENTORY_API_BASE_URL?: string;
  readonly FRONTEND_MANAGEMENT_API_BASE_URL?: string;
  readonly FRONTEND_CHECKOUT_REGISTER_ID?: string;
  readonly FRONTEND_DEFAULT_LOCALE?: string;
  readonly FRONTEND_DEV_TOOLS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
