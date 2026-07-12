---
id: structure-module-api-health
title: Module — api health (Liveness Endpoint)
type: structure
authority: canonical
status: current
owner: repository owner
summary: The liveness module — GET /api/v1/health returning the shared HealthResponse shape with service name, version, and uptime.
keywords: [health, liveness, endpoint, uptime, monitoring, api, version]
contextTier: 2
relatedCode: [apps/api/src/modules/health]
relatedTests: [apps/api/src/modules/health/tests/health.service.test.ts, apps/api/src/tests/health.integration.test.ts]
relatedDocs: [structure/module-catalog.yaml, structure/runtime-topology.md]
readWhen: You are changing the health payload, service version, or monitoring probes.
---

# Module — `apps/api/src/modules/health`

**Responsibility.** The liveness endpoint. `GET /api/v1/health`
(`api/health.controller.ts`) returns the shared `HealthResponse`
`{status: 'ok', service, version, uptimeSeconds}` built by `application/health.service.ts`.

## Public surface (`index.ts`)

`HealthModule` only.

## Key files

| File | Role |
| --- | --- |
| `api/health.controller.ts` | `@Controller('health')` → `GET /api/v1/health`; one delegation |
| `application/health.service.ts` | Builds the response (uptime from the process clock) |
| `model/health.constants.ts` | `API_SERVICE_NAME = 'twinzy-api'`, `API_SERVICE_VERSION = '0.1.0'` |

Contract: `HealthResponseSchema` in `packages/shared/src/schemas/health.schema.ts`
(status is a `z.literal('ok')`).

## Invariants

- No env keys, no errors, no events, no dependencies on other feature modules — only
  `@twinzy/shared` and the core openapi decorator.
- The route participates in the global `/api/v1` prefix like every controller
  (`apps/api/src/bootstrap/configure-lifecycle.ts`).

## Tests

- Unit: `apps/api/src/modules/health/tests/health.service.test.ts`.
- Integration: `apps/api/src/tests/health.integration.test.ts` — 200 + schema, the helmet
  `x-content-type-options: nosniff` header, and the 404 envelope shape for
  `/api/v1/unknown` (no stack leakage).

## Common changes and risks

- **Version bumps**: update `API_SERVICE_VERSION` in `model/health.constants.ts`; note the
  Swagger document carries its own version string (`apps/api/src/bootstrap/bootstrap.constants.ts`).
- **Extending the payload**: change `HealthResponseSchema` in `@twinzy/shared` first, then the
  service — it is a cross-side contract.
- **Risk**: low; this endpoint is the smoke-test and container-probe surface, so keep it
  dependency-free and fast.
