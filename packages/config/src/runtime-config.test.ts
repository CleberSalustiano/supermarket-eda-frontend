import { afterEach, describe, expect, it, vi } from 'vitest';
import { developmentDefaults } from './development-defaults';
import { createDevTenantOverrideStore, resolveFrontendRuntimeConfig } from './runtime-config';

const tenantId = '11111111-1111-4111-8111-111111111111';
const productionEnv = {
  MODE: 'production',
  FRONTEND_TENANT_ID: tenantId,
  FRONTEND_CHECKOUT_API_BASE_URL: 'https://checkout.example.com/',
  FRONTEND_MANAGEMENT_API_BASE_URL: 'https://management.example.com'
};

describe('resolveFrontendRuntimeConfig', () => {
  it('lists everything missing in production', () => {
    expect(resolveFrontendRuntimeConfig({ MODE: 'production' }, ['management', 'checkout'])).toEqual({
      ok: false,
      missing: [
        'FRONTEND_TENANT_ID',
        'FRONTEND_MANAGEMENT_API_BASE_URL',
        'FRONTEND_CHECKOUT_API_BASE_URL'
      ]
    });
  });

  it('rejects an invalid URL, tenant and locale in production', () => {
    const result = resolveFrontendRuntimeConfig(
      {
        MODE: 'production',
        FRONTEND_TENANT_ID: 'not-a-uuid',
        FRONTEND_CHECKOUT_API_BASE_URL: 'ftp://checkout.example.com',
        FRONTEND_DEFAULT_LOCALE: 'fr'
      },
      ['checkout']
    );

    expect(result).toEqual({
      ok: false,
      missing: ['FRONTEND_TENANT_ID', 'FRONTEND_CHECKOUT_API_BASE_URL', 'FRONTEND_DEFAULT_LOCALE']
    });
  });

  it('accepts a complete production config with dev tools off and no fallbacks', () => {
    const result = resolveFrontendRuntimeConfig(
      { ...productionEnv, FRONTEND_DEV_TOOLS: 'true', FRONTEND_DEFAULT_LOCALE: 'en' },
      ['management', 'checkout']
    );

    expect(result).toEqual({
      ok: true,
      config: {
        mode: 'production',
        tenantId,
        serviceBaseUrls: {
          management: 'https://management.example.com',
          checkout: 'https://checkout.example.com'
        },
        checkoutRegisterId: null,
        developmentOperatorId: null,
        defaultLocale: 'en',
        devToolsEnabled: false
      }
    });
  });

  it('keeps the register id only from the environment in production', () => {
    const result = resolveFrontendRuntimeConfig(
      { ...productionEnv, FRONTEND_CHECKOUT_REGISTER_ID: 'lane-07' },
      ['checkout']
    );

    expect(result.ok && result.config.checkoutRegisterId).toBe('lane-07');
  });

  it('falls back to the local seed defaults in development, with dev tools on', () => {
    const result = resolveFrontendRuntimeConfig({ MODE: 'development' }, ['checkout', 'inventory'], developmentDefaults);

    expect(result).toEqual({
      ok: true,
      config: {
        mode: 'development',
        tenantId: developmentDefaults.tenantId,
        serviceBaseUrls: { checkout: 'http://localhost:3001', inventory: 'http://localhost:3002' },
        checkoutRegisterId: 'register-01',
        developmentOperatorId: developmentDefaults.developmentOperatorId,
        defaultLocale: 'pt-BR',
        devToolsEnabled: true
      }
    });
  });

  it('ignores dev defaults in production even when a caller passes them', () => {
    expect(
      resolveFrontendRuntimeConfig({ MODE: 'production' }, ['checkout'], developmentDefaults)
    ).toEqual({
      ok: false,
      missing: ['FRONTEND_TENANT_ID', 'FRONTEND_CHECKOUT_API_BASE_URL']
    });
  });

  it('reports missing values outside production when no dev defaults are supplied', () => {
    expect(resolveFrontendRuntimeConfig({ MODE: 'development' }, ['inventory'])).toEqual({
      ok: false,
      missing: ['FRONTEND_TENANT_ID', 'FRONTEND_INVENTORY_API_BASE_URL']
    });
  });

  it('lets FRONTEND_DEV_TOOLS=false turn dev tools off in development', () => {
    const result = resolveFrontendRuntimeConfig(
      { MODE: 'development', FRONTEND_DEV_TOOLS: 'false' },
      ['checkout'],
      developmentDefaults
    );

    expect(result.ok && result.config.devToolsEnabled).toBe(false);
  });

  it('uses defaults with dev tools off in e2e mode', () => {
    const result = resolveFrontendRuntimeConfig({ MODE: 'e2e' }, ['management'], developmentDefaults);

    expect(result.ok && result.config.devToolsEnabled).toBe(false);
    expect(result.ok && result.config.tenantId).toBe(developmentDefaults.tenantId);
    expect(result.ok && result.config.serviceBaseUrls).toEqual({
      management: 'http://localhost:3003'
    });
  });

  it('falls back to pt-BR for an invalid locale outside production', () => {
    const result = resolveFrontendRuntimeConfig(
      { MODE: 'test', FRONTEND_DEFAULT_LOCALE: 'fr' },
      ['checkout'],
      developmentDefaults
    );

    expect(result.ok && result.config.defaultLocale).toBe('pt-BR');
  });
});

describe('createDevTenantOverrideStore', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is a no-op returning null when dev tools are disabled', () => {
    const storage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() };
    vi.stubGlobal('localStorage', storage);
    const store = createDevTenantOverrideStore('k', { devToolsEnabled: false });

    store.write(tenantId);
    store.clear();

    expect(store.read()).toBeNull();
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.getItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it('persists a valid tenant and ignores an invalid one', () => {
    const data = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
      removeItem: (key: string) => void data.delete(key)
    });
    const store = createDevTenantOverrideStore('k', { devToolsEnabled: true });

    store.write('nope');
    expect(store.read()).toBeNull();

    store.write(tenantId);
    expect(store.read()).toBe(tenantId);

    store.clear();
    expect(store.read()).toBeNull();
  });

  it('survives storage that throws', () => {
    const boom = () => {
      throw new Error('denied');
    };
    vi.stubGlobal('localStorage', { getItem: boom, setItem: boom, removeItem: boom });
    const store = createDevTenantOverrideStore('k', { devToolsEnabled: true });

    expect(store.read()).toBeNull();
    expect(() => store.write(tenantId)).not.toThrow();
    expect(() => store.clear()).not.toThrow();
  });
});
