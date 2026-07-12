---
id: operations-health-checks
title: Health Checks
type: operations
authority: canonical
status: current
owner: repository owner
summary: The GET /api/v1/health liveness endpoint and the Docker HEALTHCHECKs that poll it — what they prove and what they deliberately do not.
keywords: [health, liveness, healthcheck, docker, endpoint, uptime, readiness, probe]
contextTier: 2
relatedCode: [apps/api/src/modules/health/api/health.controller.ts, apps/api/src/modules/health/application/health.service.ts, Dockerfile.api, Dockerfile.web]
relatedTests: [apps/api/src/tests/health.integration.test.ts, apps/api/src/modules/health/tests/health.service.test.ts]
relatedDocs: [operations/deployment-model.md, runbooks/api-outage.md, runbooks/release-smoke-test.md]
readWhen: You are wiring monitoring, debugging an unhealthy container, or changing the health surface.
---

# Health Checks

## Application endpoint

`GET /api/v1/health` (HealthController → HealthService,
[apps/api/src/modules/health/api/health.controller.ts](../apps/api/src/modules/health/api/health.controller.ts))
returns the shared `HealthResponse`:

```json
{ "status": "ok", "service": "twinzy-api", "version": "0.1.0", "uptimeSeconds": 123.4 }
```

Values come from [apps/api/src/modules/health/model/health.constants.ts](../apps/api/src/modules/health/model/health.constants.ts)
and `process.uptime()` ([apps/api/src/modules/health/application/health.service.ts](../apps/api/src/modules/health/application/health.service.ts)).
The endpoint is anonymous, has no dependencies on other modules, and reads no env
(module map evidence: the health module imports nothing but `@twinzy/shared` and core).

**It is a liveness check only.** It does not probe the AI provider, ClamAV, or PayPal — there
is no database and no readiness aggregation. A green health endpoint with a failing AI provider
is a known, expected combination; that scenario is owned by
[runbooks/ai-provider-outage.md](../runbooks/ai-provider-outage.md).

## Docker healthchecks

Both images define a `HEALTHCHECK` with interval 30 s, timeout 5 s, start period 15 s, retries 3:

| Image | Command | Source |
| --- | --- | --- |
| twinzy-api | `wget -qO- http://127.0.0.1:4000/api/v1/health` | [Dockerfile.api](../Dockerfile.api) |
| twinzy-web | `wget -qO- http://127.0.0.1:3000/` | [Dockerfile.web](../Dockerfile.web) |

The clamav sidecar has no healthcheck in [docker-compose.yml](../docker-compose.yml); the API
compensates at call time — scan errors fail closed
([apps/api/src/modules/file-security/application/virus-scan.service.ts](../apps/api/src/modules/file-security/application/virus-scan.service.ts)).

## Verification

- Integration test: 200 + schema, helmet `x-content-type-options: nosniff` header, and a safe
  404 envelope for unknown routes
  ([apps/api/src/tests/health.integration.test.ts](../apps/api/src/tests/health.integration.test.ts)).
- Post-deploy: the smoke-test runbook exercises health as its first step
  ([runbooks/release-smoke-test.md](../runbooks/release-smoke-test.md)).

## Change discipline

If the health surface changes, update this doc, both Dockerfile HEALTHCHECKs, and the smoke
test in the same delivery stream (CLAUDE.md: "if runtime health … changes, smoke tests and
health checks must change with it").
