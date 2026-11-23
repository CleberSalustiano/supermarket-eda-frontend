import { developmentDefaults, resolveFrontendRuntimeConfig } from '@supermarket/frontend-config';

export const runtimeConfigResult = resolveFrontendRuntimeConfig(
  import.meta.env,
  ['management', 'checkout'],
  // Static guard: Vite drops the dev defaults from production bundles.
  import.meta.env.MODE === 'production' ? null : developmentDefaults
);
