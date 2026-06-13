# Supermarket Frontend Apps

Frontend monorepo for the supermarket ecosystem.

## Layout

- `apps/checkout-web`: POS-facing frontend
- `apps/inventory-web`: stock and warehouse frontend
- `apps/management-web`: catalog, employee, and finance frontend
- `packages/api-sdk`: backend route inventory and shared transport helpers
- `packages/config`: frontend configuration helpers
- `packages/tenant`: tenant-aware transport conventions
- `packages/ui`: shared UI primitives and design-system layer

## Workspace Intent

This repository is intentionally separate from the backend repository so the frontend can evolve with its own release flow while still sharing code across the three applications.

