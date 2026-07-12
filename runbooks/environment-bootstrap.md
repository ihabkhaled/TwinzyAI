---
id: runbook-environment-bootstrap
title: Runbook — Environment Bootstrap (.env from .env.example)
type: runbook
authority: canonical
status: current
owner: repository owner
summary: Creating and maintaining a valid .env — required variable groups, fail-fast validation behavior, file lookup order, and verification.
keywords: [runbook, env, environment, bootstrap, dotenv, config, validation, fail-fast, secrets]
contextTier: 2
relatedCode:
  [
    .env.example,
    apps/api/src/config/env.schema.ts,
    apps/api/src/config/config.module.ts,
    apps/web/src/packages/env/public-env.ts,
  ]
relatedTests: [apps/api/src/config/env.schema.test.ts]
relatedDocs: [docs/env-vars.md, runbooks/config-change.md, runbooks/secret-rotation.md]
readWhen: Creating a new environment, or the API refuses to boot with an environment-configuration error.
---

# Runbook — Environment Bootstrap

The canonical per-variable reference (name, purpose, default, sensitivity) is [`docs/env-vars.md`](../docs/env-vars.md). Every backend variable is defined once in the zod schema `apps/api/src/config/env.schema.ts` — invalid config **crashes startup on purpose** (`validateEnv`), so a misconfigured service never limps.

## Prerequisites

- Repo cloned; know which posture you're bootstrapping: free (default), donate-link, or sandbox paywall.

## Steps

1. `cp .env.example .env` at the repo root. **Never commit `.env`** (gitignored; `SECURITY.md`).
2. Fill the groups you need (`.env.example` is organized by group, with inline docs):
   - **Runtime**: `NODE_ENV`, `API_PORT` (4000), `WEB_PORT` (3000), `TRUST_PROXY` (true only behind a trusted proxy), `LOG_LEVEL`.
   - **CORS**: `CORS_ALLOWED_ORIGINS` — comma list; **empty means CORS closed** (`apps/api/src/bootstrap/configure-security.ts`).
   - **AI (required for real analyses)**: `GEMINI_API_KEY`, `GEMINI_MODEL` (+ optional fallbacks, per-step chains, `AI_ROUTE_*`, provider keys — `docs/provider-routing.md`). `GEMINI_MODEL` always comes from env, never hardcoded (product constraint).
   - **Payments (optional; default OFF)**: leave `PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET`/`NEXT_PUBLIC_PAYPAL_CLIENT_ID` blank for the free game. Setting them enables the paid gate — sandbox only; LIVE is not approved (`docs/features/paypal-donations-and-paid-results/22-go-no-go.md`).
   - **Uploads/ClamAV**: `MAX_IMAGE_SIZE_BYTES` (default 5 MB), `ENABLE_CLAMAV` (+ `CLAMAV_HOSTS`, `CLAMAV_PORT` — fail-closed when enabled).
   - **Concurrency/streaming**: `MAX_GLOBAL_ACTIVE_ANALYSES`, `MAX_ACTIVE_ANALYSES_PER_IP`, `MAX_ACTIVE_ANALYSES_PER_TAB`, `MAX_ANALYSIS_QUEUE_SIZE`, `ANALYSIS_TIMEOUT_MS`, `STREAM_TTL_MS` — the schema enforces `STREAM_TTL_MS >= ANALYSIS_TIMEOUT_MS` (superRefine in `env.schema.ts`).
   - **Share links**: `SHARE_RESULT_TTL_SECONDS`, payload/active caps, `SHARE_RESULT_PUBLIC_BASE_URL` (must be the deployed web origin in production).
   - **Frontend public values**: `NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_PAYPAL_ME_USERNAME` (donate link; empty = hidden), display-only `NEXT_PUBLIC_PAYMENT_PRICE_*`. Validated by `apps/web/src/packages/env/public-env.ts`.
3. File lookup order (backend): `apps/api/.env` first, then the repo root `.env`; real `process.env` always wins over files (`apps/api/src/config/config.module.ts`). One root `.env` is the normal setup.
4. When `.env.example` changes in a pull, mirror the change into your local `.env` — the example file is the contract ([config-change.md](./config-change.md)).

## Verify

```bash
npm run dev:api
# expect: "API listening on port 4000 (development)" in the logs
curl -i http://localhost:4000/api/v1/health
```

A bad value fails fast with `Invalid environment configuration:` naming the offending variable — fix and restart. Schema behavior is unit-tested in `apps/api/src/config/env.schema.test.ts`.

## Rollback

Env changes are the cheapest rollback in the system: restore the previous value and restart. Feature levers (paywall, donate link, providers, ClamAV) are all deliberately env-only rollbacks ([rollback.md](./rollback.md)).
