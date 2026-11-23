import type { DevelopmentDefaults } from './development-defaults';
import {
  serviceEnvironmentKeyMap,
  type FrontendServiceName
} from './backend-environment';

export type RuntimeLocale = 'pt-BR' | 'en';

export type FrontendRuntimeConfig = {
  mode: string;
  tenantId: string;
  serviceBaseUrls: Partial<Record<FrontendServiceName, string>>;
  checkoutRegisterId: string | null;
  developmentOperatorId: string | null;
  defaultLocale: RuntimeLocale;
  devToolsEnabled: boolean;
};

export type RuntimeConfigResult =
  | { ok: true; config: FrontendRuntimeConfig }
  | { ok: false; missing: string[] };

export const runtimeEnvironmentKeys = {
  tenantId: 'FRONTEND_TENANT_ID',
  checkoutRegisterId: 'FRONTEND_CHECKOUT_REGISTER_ID',
  defaultLocale: 'FRONTEND_DEFAULT_LOCALE',
  devTools: 'FRONTEND_DEV_TOOLS'
} as const;

const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidV4(value: string): boolean {
  return uuidV4Pattern.test(value);
}

function readString(env: Record<string, unknown>, key: string): string | null {
  const value = env[key];

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    return value.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

function isRuntimeLocale(value: string): value is RuntimeLocale {
  return value === 'pt-BR' || value === 'en';
}

export function resolveFrontendRuntimeConfig(
  env: Record<string, unknown>,
  requiredServices: FrontendServiceName[],
  defaults: DevelopmentDefaults | null = null
): RuntimeConfigResult {
  const mode = readString(env, 'MODE') ?? 'development';
  const production = mode === 'production';
  // Production never reads dev defaults, even when a caller passes them.
  const fallback = production ? null : defaults;
  const missing: string[] = [];

  const rawTenant = readString(env, runtimeEnvironmentKeys.tenantId);
  let tenantId = '';

  if (rawTenant !== null && isUuidV4(rawTenant)) {
    tenantId = rawTenant;
  } else if (fallback !== null) {
    tenantId = fallback.tenantId;
  } else {
    missing.push(runtimeEnvironmentKeys.tenantId);
  }

  const serviceBaseUrls: Partial<Record<FrontendServiceName, string>> = {};

  for (const service of requiredServices) {
    const key = serviceEnvironmentKeyMap[service];
    const raw = readString(env, key);
    const normalized = raw === null ? null : normalizeHttpUrl(raw);

    if (normalized !== null) {
      serviceBaseUrls[service] = normalized;
    } else if (fallback !== null) {
      serviceBaseUrls[service] = fallback.serviceBaseUrls[service];
    } else {
      missing.push(key);
    }
  }

  const rawRegister = readString(env, runtimeEnvironmentKeys.checkoutRegisterId);
  const validRegister =
    rawRegister !== null && rawRegister.length >= 2 && rawRegister.length <= 32
      ? rawRegister
      : null;
  const checkoutRegisterId = validRegister ?? fallback?.checkoutRegisterId ?? null;

  const rawLocale = readString(env, runtimeEnvironmentKeys.defaultLocale);
  let defaultLocale: RuntimeLocale = 'pt-BR';

  if (rawLocale !== null) {
    if (isRuntimeLocale(rawLocale)) {
      defaultLocale = rawLocale;
    } else if (production) {
      missing.push(runtimeEnvironmentKeys.defaultLocale);
    }
  }

  if (missing.length > 0) {
    return { ok: false, missing };
  }

  const devToolsFlag = readString(env, runtimeEnvironmentKeys.devTools);
  const devToolsEnabled =
    !production && (devToolsFlag === 'true' || (mode === 'development' && devToolsFlag !== 'false'));

  return {
    ok: true,
    config: {
      mode,
      tenantId,
      serviceBaseUrls,
      checkoutRegisterId,
      developmentOperatorId: fallback?.developmentOperatorId ?? null,
      defaultLocale,
      devToolsEnabled
    }
  };
}

export type DevTenantOverrideStore = {
  read(): string | null;
  write(tenantId: string): void;
  clear(): void;
};

export function createDevTenantOverrideStore(
  storageKey: string,
  config: Pick<FrontendRuntimeConfig, 'devToolsEnabled'>
): DevTenantOverrideStore {
  if (!config.devToolsEnabled) {
    return { read: () => null, write: () => undefined, clear: () => undefined };
  }

  return {
    read() {
      try {
        const stored = localStorage.getItem(storageKey);

        return stored !== null && isUuidV4(stored) ? stored : null;
      } catch {
        return null;
      }
    },
    write(tenantId) {
      if (!isUuidV4(tenantId)) {
        return;
      }

      try {
        localStorage.setItem(storageKey, tenantId);
      } catch {
        // Storage can be unavailable (private mode); the override is simply not persisted.
      }
    },
    clear() {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // Nothing to clear when storage is unavailable.
      }
    }
  };
}
