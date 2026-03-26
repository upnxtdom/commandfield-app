# CommandField App

CommandField is a single-service Node.js deployment:
- Express API (`index.js`, `routes/`, `lib/`)
- React dashboard (`client/`) built into `public/`

## Ownership Baseline

This repository is the source of truth for deploys. Replit artifact folders and handoff files are removed from the active runtime path.

## Runtime Requirements

- Node.js 20 (`.nvmrc` and `package.json` engines)
- npm 10+

## Local Setup

1. Install dependencies:
   - `npm ci`
   - `npm --prefix client ci`
2. Set environment variables from `.env.example`.
3. Build frontend:
   - `npm run build`
4. Start API + static frontend:
   - `npm start`

## Smoke Checks

1. Health:
   - `curl -i http://127.0.0.1:3000/health`
2. Auth gate:
   - `curl -i http://127.0.0.1:3000/api/customers`
   - Expect `401 Unauthorized` without bearer token.
3. Public routes:
   - `/api/auth/login`
   - `/api/webhooks/stripe`
   - `/api/enterprise/apply`

## Railway Deploy

Railway build and deploy settings are committed in `railway.json` and `nixpacks.toml`:
- Build: `npm ci && npm --prefix client ci && npm run build`
- Start: `npm start`
- Health check: `/health`

Deploy flow:
1. Deploy branch to staging service URL.
2. Run smoke checks on Railway URL.
3. Cut over custom domain after staging passes.
