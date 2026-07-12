---
id: operations-readiness-checklist
title: Operational Readiness Checklist
type: operations
authority: canonical
status: current
owner: repository owner
summary: The pre-run checklist for standing up or redeploying the stack — config, security posture, paywall levers, health, and smoke verification.
keywords: [readiness, checklist, deploy, config, env, smoke-test, paywall, cors, proxy]
contextTier: 2
relatedCode: [docker-compose.yml, apps/api/src/config/env.schema.ts, .env.example]
relatedTests: [apps/api/src/config/env.schema.test.ts]
relatedDocs: [docs/release-checklist.md, runbooks/release-smoke-test.md, quality/release-readiness.md, docs/env-vars.md]
readWhen: You are about to start, deploy, or reconfigure the stack in any environment.
---

# Operational Readiness Checklist

Release *approval* is owned by [quality/release-readiness.md](../quality/release-readiness.md)
and [rules/24-release-gate.md](../rules/24-release-gate.md). This checklist is the operational
subset: what must be true of the runtime before it serves traffic.

## Configuration

- [ ] `.env` matches the documented surface in [docs/env-vars.md](../docs/env-vars.md) and the
      committed [.env.example](../.env.example); startup fail-fast will crash on invalid values
      ([apps/api/src/config/env.schema.ts](../apps/api/src/config/env.schema.ts)).
- [ ] `GEMINI_MODEL` (and any per-step chains / `AI_ROUTE_<STEP>`) set deliberately — models are
      never hardcoded (CLAUDE.md product constraint #6).
- [ ] `CORS_ALLOWED_ORIGINS` lists the real web origin(s); empty means CORS is CLOSED
      ([apps/api/src/bootstrap/configure-security.ts](../apps/api/src/bootstrap/configure-security.ts)).
- [ ] `TRUST_PROXY=true` **only** when behind a trusted reverse proxy; default `false` protects
      per-IP caps ([apps/api/src/bootstrap/fastify-adapter.ts](../apps/api/src/bootstrap/fastify-adapter.ts)).
- [ ] Paywall levers deliberate: `PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET` blank keeps the game
      fully free (default); both set turns the paid gate ON. `PAYPAL_ENV=live` is NOT approved —
      4 open conditions ([docs/features/paypal-donations-and-paid-results/22-go-no-go.md](../docs/features/paypal-donations-and-paid-results/22-go-no-go.md)).
- [ ] `NEXT_PUBLIC_API_BASE_URL` build arg points at the real API origin — it is baked at image
      build time ([Dockerfile.web](../Dockerfile.web)).
- [ ] If `ENABLE_CLAMAV=true`: the `clamav` compose profile is started and reachable on
      `CLAMAV_HOSTS`; remember scan failures fail closed
      ([apps/api/src/modules/file-security/application/virus-scan.service.ts](../apps/api/src/modules/file-security/application/virus-scan.service.ts)).
- [ ] No secrets in images, logs, or the repo — rotation procedure exists at
      [runbooks/secret-rotation.md](../runbooks/secret-rotation.md).

## Runtime

- [ ] Images rebuilt from the released revision (`npm run docker:up` / `docker:rebuild`,
      [package.json](../package.json)); image scan clean (`security:scan:images`).
- [ ] Both containers report healthy (Docker HEALTHCHECK — [health-checks.md](health-checks.md)).
- [ ] `GET /api/v1/health` returns `status: ok` from outside the container.
- [ ] Smoke test executed per [runbooks/release-smoke-test.md](../runbooks/release-smoke-test.md).
- [ ] Logs inspected for startup errors (`npm run docker:logs`); log level appropriate
      (`LOG_LEVEL`, [operations/logging-catalog.md](logging-catalog.md)).

## Reversibility

- [ ] Rollback path confirmed: `git revert` + rebuild + redeploy — valid because nothing is
      persisted ([runbooks/README.md](../runbooks/README.md)); note active share links and
      in-flight runs are lost on restart ([graceful-shutdown.md](graceful-shutdown.md)).
