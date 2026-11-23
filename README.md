# Supermarket Frontend Apps

Frontend monorepo for the supermarket ecosystem.

## Layout

- `apps/checkout-web`: POS-facing frontend
- `apps/inventory-web`: stock and warehouse frontend
- `apps/management-web`: catalog, employee, and finance frontend
- `apps/operations-mobile`: mobile application for stock operations and management quick access
- `packages/api-sdk`: backend route inventory and shared transport helpers
- `packages/config`: frontend configuration helpers
- `packages/tenant`: tenant-aware transport conventions
- `packages/ui`: shared UI primitives, design tokens, and Tailwind preset layer

## Stack

- Web: React, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, Vitest, Cypress
- Mobile: React Native, Expo, NativeWind, React Navigation, TanStack Query, React Hook Form, Zod, Jest

## Design Direction

- Shelf-tag system: the sale total is a yellow price tag, and the dark theme is the slate shelf rail it hangs on.
- Light and dark themes, chosen in Preferências as Sistema, Claro or Escuro; the theme is applied before first paint (`packages/ui/public/theme-init.js`).
- Two languages: pt-BR (default) and English, through the typed catalogs in `apps/*/src/i18n` and `packages/ui/src/i18n`.
- Every color is a token with a light and a dark value in `packages/ui/src/theme/tokens.json` (the only source; contrast is tested for both themes).
- Type: Barlow Condensed for totals and titles, Atkinson Hyperlegible Next for UI text (unambiguous `0/O` and `1/l/I` for codes).
- The checkout is keyboard-first: F2 new sale, F4 cancel, F8 payment, F9 complete, Esc back to the scanner, `3*código` for several units.

## Workspace Intent

This repository is intentionally separate from the backend repository so the frontend can evolve with its own release flow while still sharing code across the three applications.

## Local Runbook

- Install dependencies: `npm install`
- Start management web: `./scripts/start-app.sh management-web dev`
- Start checkout web: `./scripts/start-app.sh checkout-web dev`
- Start inventory web: `./scripts/start-app.sh inventory-web dev`
- Start the mobile app: `./scripts/start-app.sh operations-mobile dev`
- Preview a production build for a web app: `./scripts/start-app.sh management-web preview`

## Default Local Ports

- `management-web`: `http://127.0.0.1:4200` in preview, `http://localhost:4100` in dev
- `checkout-web`: `http://127.0.0.1:4201` in preview, `http://localhost:4101` in dev
- `inventory-web`: `http://127.0.0.1:4202` in preview, `http://localhost:4102` in dev
- `operations-mobile`: Expo dev server on `http://localhost:8081`

## Backend Integration Defaults

- `management-service`: `http://localhost:3003`
- `checkout-service`: `http://localhost:3001`
- `inventory-service`: `http://localhost:3002`

In development (`vite` dev server, `build:e2e`), each app uses the localhost defaults above. Production builds never contain them: the addresses come only from the `FRONTEND_*` variables below, and a build without the required ones shows the "Configuração incompleta" screen.

## Configuração de produção

The `FRONTEND_*` values are read at build time (Vite `envPrefix` includes `FRONTEND_`). Copy `apps/<app>/.env.example` to `.env.production` (git-ignored) in the app folder and set real values before `npm run build`.

| Variable | Apps | Required in production | Notes |
|---|---|---|---|
| `FRONTEND_TENANT_ID` | all three web apps | yes | Tenant (store) UUID |
| `FRONTEND_CHECKOUT_API_BASE_URL` | checkout, management | yes | Checkout service base URL |
| `FRONTEND_MANAGEMENT_API_BASE_URL` | management | yes | Management service base URL |
| `FRONTEND_INVENTORY_API_BASE_URL` | inventory | yes | Inventory service base URL |
| `FRONTEND_CHECKOUT_REGISTER_ID` | checkout | to open a register | Fixes the register for this terminal |
| `FRONTEND_DEFAULT_LOCALE` | all three web apps | no | `pt-BR` (default) or `en`; the user's choice in Preferências wins |
| `FRONTEND_DEV_TOOLS` | all three web apps | no | Development only; ignored in production builds |

Local checks:

- `npm run build:e2e --workspace @supermarket/<app>` builds in the `e2e` mode used by Cypress.
- `npm run check:bundles` builds each web app in production mode and fails if any development-only value (localhost URLs, dev tenant or operator IDs, developer tools text) is in the bundle.
- `apps/operations-mobile` keeps its own `EXPO_PUBLIC_FRONTEND_*` configuration.

## Testes manuais

The step-by-step manual test guide, in pt-BR, is at [`docs/guia-de-teste-manual.md`](docs/guia-de-teste-manual.md). It starts with `npm run local:up` in `backend-services/` and covers the checkout, management and inventory screens, light and dark themes, pt-BR and English, and a 375 px check.
