---
id: operations-deployment-model
title: Deployment Model
type: operations
authority: canonical
status: current
owner: repository owner
summary: How the Twinzy stack is built and deployed — Docker Compose, multi-stage non-root images, healthchecks, and the no-volumes/no-database posture.
keywords: [deployment, docker, compose, images, healthcheck, non-root, rollback, ports]
contextTier: 2
relatedCode: [docker-compose.yml, docker-compose.dev.yml, Dockerfile.api, Dockerfile.web]
relatedTests: [apps/api/src/tests/health.integration.test.ts]
relatedDocs: [docs/docker-local-dev.md, operations/service-catalog.yaml, runbooks/release-smoke-test.md]
readWhen: You are deploying, rebuilding, or changing how the containers are built or wired.
---

# Deployment Model

The deployable inventory (ports, limits, hardening flags) is
[operations/service-catalog.yaml](service-catalog.yaml). Developer workflows are owned by
[docs/docker-local-dev.md](../docs/docker-local-dev.md). This doc records the model itself.

## Production-shaped stack — `docker-compose.yml`

- Three services: `api` (published on `${API_PORT:-4000}`), `web` (published on
  `${WEB_PORT:-3000}`, `depends_on: api`), and `clamav` behind the `clamav` compose profile
  (expose-only on 3310, never published) — [docker-compose.yml](../docker-compose.yml).
- Both app containers run `NODE_ENV=production`, `restart: unless-stopped`, `read_only: true`
  with `tmpfs: /tmp`, `no-new-privileges`, and `cap_drop: ALL`.
- The api service has **no volumes on purpose**: "uploads must never persist"
  ([docker-compose.yml](../docker-compose.yml) comment). There is no database service; the API
  is stateless ([apps/api/src/modules/privacy/privacy.module.ts](../apps/api/src/modules/privacy/privacy.module.ts)).
- Secrets (e.g. `GEMINI_API_KEY`, PayPal credentials) are injected as environment variables at
  run time, never baked into images ([Dockerfile.api](../Dockerfile.api) comment: "no secrets baked").

## Images

Both images are multi-stage `node:22-alpine` builds that end in a non-root `USER node` runner
stage with a Docker `HEALTHCHECK` (30s interval, 5s timeout, 15s start period, 3 retries):

| Image | Build | Runtime artifact | Healthcheck target |
| --- | --- | --- | --- |
| `twinzy-api:local` | deps → build → prod-deps → runner ([Dockerfile.api](../Dockerfile.api)) | `apps/api/dist` + production `node_modules` | `http://127.0.0.1:4000/api/v1/health` |
| `twinzy-web:local` | deps → build (Next standalone) → runner ([Dockerfile.web](../Dockerfile.web)) | `.next/standalone` server | `http://127.0.0.1:3000/` |

`NEXT_PUBLIC_API_BASE_URL` is a **build arg** for the web image — changing the API origin
requires rebuilding `twinzy-web` ([Dockerfile.web](../Dockerfile.web)).

## Commands

Root [package.json](../package.json) scripts: `docker:up` (`docker compose up -d --build`),
`docker:down`, `docker:logs`, `docker:rebuild` (`--no-cache`). Image vulnerability scanning:
`security:scan:images` (Trivy, HIGH/CRITICAL, exit 1).

## Development stack — `docker-compose.dev.yml`

A single `node:24-alpine` service mounts the workspace and runs `npm ci && npm run dev` with
hot reload on ports 3000 + 4000 ([docker-compose.dev.yml](../docker-compose.dev.yml)). It is a
convenience wrapper, not the deployment model.

## Rollback

No database and no persisted state means rollback is always `git revert` + rebuild + redeploy
([runbooks/README.md](../runbooks/README.md)). Post-deploy verification is
[runbooks/release-smoke-test.md](../runbooks/release-smoke-test.md).

## Not applicable

- **Orchestrator manifests (Kubernetes, Nomad, etc.)** — none exist in the repository; Docker
  Compose is the only recorded deployment mechanism.
- **Deployed public HTTPS origin** — none is recorded yet; a deployed HTTPS origin is condition 1
  of the paywall LIVE gate
  ([docs/features/paypal-donations-and-paid-results/22-go-no-go.md](../docs/features/paypal-donations-and-paid-results/22-go-no-go.md)).
