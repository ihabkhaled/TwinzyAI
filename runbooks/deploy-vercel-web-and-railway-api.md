---
id: runbook-deploy-vercel-web-railway-api
title: Runbook — Split Deploy (Vercel web + Railway API)
type: runbook
authority: canonical
status: current
owner: repository owner
summary: Deploy the two Twinzy services as separate hosts — the Next.js frontend on Vercel (root apps/web) and the long-running NestJS API on Railway (repo root, railway.json) — wired by NEXT_PUBLIC_API_BASE_URL and CORS_ALLOWED_ORIGINS.
keywords: [runbook, deployment, vercel, railway, monorepo, husky, cors, nixpacks, sse, healthcheck]
contextTier: 2
relatedCode: [railway.json, package.json, apps/api/src/bootstrap/bootstrap.ts, apps/web/src/packages/env/public-env.ts]
relatedTests: []
relatedDocs: [runbooks/deployment.md, runbooks/environment-bootstrap.md, runbooks/rollback.md]
readWhen: Deploying the frontend and backend to separate managed hosts.
---

# Runbook — Split Deploy (Vercel web + Railway API)

## Why two services

The two apps are already decoupled: the web talks to the API only over HTTP via
`NEXT_PUBLIC_API_BASE_URL` ([public-env.ts](../apps/web/src/packages/env/public-env.ts)),
and CORS is env-driven ([configure-security.ts](../apps/api/src/bootstrap/configure-security.ts)).
They must deploy to **separate hosts** because:

- A Vercel import builds **one** project rooted at one directory — it will only ever
  build `apps/web`. That is correct, not a detection failure.
- The API is a **long-running Fastify server** (`app.listen(...)` in
  [bootstrap.ts](../apps/api/src/bootstrap/bootstrap.ts)) that needs a warm, stateful
  process: SSE streaming ([sse-writer.ts](../apps/api/src/core/http/sse-writer.ts)),
  an optional persistent ClamAV TCP socket, long AI calls, and in-memory concurrency
  limits. Vercel's serverless functions (max-duration caps, no persistent sockets) are
  the wrong fit; a container host (Railway) is right.

## Prerequisite — the `prepare`/husky install fix

`package.json` `prepare` is `husky || true`. When a host installs without
devDependencies (or with `--omit=dev`) the `husky` binary is absent, so a bare
`prepare: "husky"` exits 127 and aborts `npm install` on **both** Vercel and Railway.
The `|| true` makes `prepare` a no-op when husky is missing; locally husky is installed
so git hooks are still set up. Do not revert this.

## Frontend — Vercel

1. Import `ihabkhaled/TwinzyAI`, **Root Directory = `apps/web`**, framework Next.js
   (auto-detected). Leave build/install commands as detected.
2. Environment variable (Production + Preview):
   - `NEXT_PUBLIC_API_BASE_URL = https://<your-railway-api-domain>` — build-time
     (`NEXT_PUBLIC_*`), so **redeploy web** after the API is live and this is set.
3. Deploy. The frontend is static/SSR; it holds no secrets beyond public `NEXT_PUBLIC_*`.

## Backend — Railway

1. New Railway project → Deploy from `ihabkhaled/TwinzyAI`, branch `main`.
2. Service settings:
   - **Root Directory = `/`** (repo root). This is required so the npm workspace,
     `package-lock.json`, and `@twinzy/shared` are all present for the build.
   - Build/start come from [`railway.json`](../railway.json) (Nixpacks): it builds
     `@twinzy/shared` then `@twinzy/api` and starts `node apps/api/dist/main.js`.
   - Node version is pinned by [`.nvmrc`](../.nvmrc) (22.20.0).
   - Healthcheck path is `/api/v1/health` (global prefix `api` + URI version `v1`).
   - (Optional) Watch paths `apps/api/**`, `packages/shared/**`, `railway.json` so a
     web-only commit does not redeploy the API.
3. **Port mapping (required — otherwise the healthcheck fails and Railway crash-loops the
   deploy):** the API binds `API_PORT` (default 4000, [env.schema.ts](../apps/api/src/config/env.schema.ts)),
   but Railway assigns a port via `PORT`. Add a service variable
   `API_PORT = ${{ PORT }}` so the app listens on Railway's port.

### Railway environment variables

Every var has a safe default, so a missing var will **not** crash boot — only an
*invalid* value fails fast (e.g. `ENABLE_CLAMAV=treu`). Set:

| Variable | Value | Why |
| --- | --- | --- |
| `API_PORT` | `${{ PORT }}` | Bind to Railway's assigned port (see above). |
| `NODE_ENV` | `production` | Production logging/behavior. |
| `TRUST_PROXY` | `true` | Railway runs behind an edge proxy; needed for correct client IP → per-IP rate limiting and concurrency caps. Only ever `true` behind a trusted proxy. |
| `CORS_ALLOWED_ORIGINS` | `https://<your-vercel-domain>` | CORS is **closed by default**; without this the browser blocks every call. Comma-separate multiple origins. |
| `SHARE_RESULT_PUBLIC_BASE_URL` | `https://<your-vercel-domain>` | Server builds the shareable `/share/<uuid>` URL from this. |
| `GEMINI_API_KEY` | your key | Required for the pipeline to actually produce results (defaults to empty → analyses fail, but boot survives). |
| `GEMINI_MODEL` | e.g. `gemini-2.5-flash` | Never hardcoded in code; comes from env. |

Payments stay **off** — leave `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` blank until
every recorded LIVE condition is signed off
(`docs/features/paypal-donations-and-paid-results/22-go-no-go.md`). Blank credentials =
the game is fully free and no payment path executes.

### ClamAV note (upload AV scanning)

`ENABLE_CLAMAV` defaults to `false`, so on Railway with no clamd the API boots fine and
uploads are still validated (consent flag, single-file, size/MIME/extension/consistency/
magic-bytes/decode). Antivirus scanning is simply not performed. To enable it, run a
clamd sidecar and set `ENABLE_CLAMAV=true` + `CLAMAV_HOSTS`/`CLAMAV_PORT`; note that when
enabled it **fails closed** in production, so an unreachable clamd rejects uploads.

## Smoke test (after both are live)

1. `curl https://<railway-api>/api/v1/health` → `200` with a health body.
2. Load the Vercel site; confirm no CORS errors in the browser console.
3. Run one full analysis end-to-end; confirm the SSE stream progresses and a result
   renders (this exercises streaming, which serverless could not host).
4. Confirm a share link opens (`SHARE_RESULT_PUBLIC_BASE_URL` correct).

## Rollback

- Vercel: promote the previous deployment (instant) from the project's Deployments tab.
- Railway: redeploy the previous successful deployment from the service's Deployments
  tab. Both hosts keep prior builds; no data migration is involved (the API is stateless
  — PayPal is the only ledger and there is no database).
