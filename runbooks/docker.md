---
id: runbook-docker
title: Runbook — Docker Compose Operations
type: runbook
authority: canonical
status: current
owner: repository owner
summary: Operating the production-style Compose stack — up/down/logs/rebuild, the ClamAV profile, healthchecks, and hardening facts.
keywords: [runbook, docker, compose, containers, healthcheck, clamav, rebuild, logs, hardening]
contextTier: 2
relatedCode: [docker-compose.yml, docker-compose.dev.yml, Dockerfile.api, Dockerfile.web, package.json]
relatedTests: []
relatedDocs: [docs/docker-local-dev.md, runbooks/release-smoke-test.md, runbooks/api-outage.md]
readWhen: Starting, stopping, rebuilding, or diagnosing the containerized stack.
---

# Runbook — Docker Compose Operations

Stack (`docker-compose.yml`): `api` (port 4000), `web` (port 3000), optional `clamav` under the `clamav` profile (internal port 3310, not published). Deep dive: [`docs/docker-local-dev.md`](../docs/docker-local-dev.md).

## Prerequisites

- Docker with Compose v2; a root `.env` ([environment-bootstrap.md](./environment-bootstrap.md)) — compose interpolates `GEMINI_API_KEY`, `CORS_ALLOWED_ORIGINS`, etc. from it.

## Steps

```bash
npm run docker:up        # docker compose up -d --build
npm run docker:logs      # docker compose logs -f
npm run docker:down      # docker compose down
npm run docker:rebuild   # docker compose build --no-cache  (suspect stale layers/deps)
```

(Script definitions: root `package.json`.)

- **ClamAV scanning**: `docker compose --profile clamav up -d clamav`, and set `ENABLE_CLAMAV=true` (+ `CLAMAV_HOSTS` including `clamav`). Remember: enabled + unreachable = uploads rejected 503, fail-closed ([upload-failures.md](./upload-failures.md)).
- **Dev hot-reload variant**: `docker compose -f docker-compose.dev.yml up` — one `node:24-alpine` container running `npm ci && npm run dev` with the repo mounted (`docker-compose.dev.yml`).

## Healthchecks

Both images bake in a `HEALTHCHECK` (`--interval=30s --timeout=5s --start-period=15s --retries=3`, `Dockerfile.api` / `Dockerfile.web`), so `docker compose ps` shows health status. The API's HTTP probe is `GET /api/v1/health`.

## Hardening facts (do not "fix" these)

Per `docker-compose.yml`: containers run `read_only` with tmpfs `/tmp`, `cap_drop: ALL`, `no-new-privileges`, memory/CPU limits (api 1g/1.0, web 512m/0.5), `restart: unless-stopped`, and **no volumes on the api by design — uploads must never persist**. Adding a volume to `api` is a privacy-policy violation, not a convenience.

## Verify

```bash
docker compose ps                                  # api + web Up (healthy)
curl -i http://localhost:4000/api/v1/health        # 200 + x-content-type-options: nosniff
```

Then the analyze happy path per [release-smoke-test.md](./release-smoke-test.md) §3.

## Rollback

- Stack-level: `docker compose down`, check out the previous revision, `docker compose up -d --build` ([rollback.md](./rollback.md)).
- Image-level scan before promoting: `npm run security:scan:images` (Trivy on `twinzy-api:local` / `twinzy-web:local`, root `package.json`).

## Troubleshooting

| Symptom | Action |
| --- | --- |
| `api` restarting/exited | Fail-fast config error — [`api-outage.md`](./api-outage.md) §2 |
| Web can't reach API | `NEXT_PUBLIC_API_BASE_URL` build arg and `CORS_ALLOWED_ORIGINS` mismatch (`docker-compose.yml`) |
| Stale behavior after dependency change | `npm run docker:rebuild` (no-cache) — never trust partial rebuilds for shared/lib changes |
| Upload 503s with ClamAV on | `docker compose --profile clamav ps`; bring clamd up or consciously disable the flag via change control |
