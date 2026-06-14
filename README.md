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

- Professional and minimal
- Neutral palette with restrained accent usage
- Production-ready foundations before feature sprawl

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

Each app ships with localhost defaults and can be redirected through environment variables without changing the shared transport code.
