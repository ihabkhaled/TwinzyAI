---
id: structure-configuration-map
title: Configuration Map — Where Config Lives on Each Side
type: structure
authority: canonical
status: current
owner: repository owner
summary: Where configuration is defined, validated, and consumed — the backend env schema and AppConfigService, the web publicEnv reader, and the files that must move together when config changes.
keywords: [configuration, env, environment, zod, app-config, public-env, validation, fail-fast, secrets]
contextTier: 2
relatedCode: [apps/api/src/config/env.schema.ts, apps/api/src/config/app-config.service.ts, apps/web/src/packages/env/public-env.ts, .env.example]
relatedTests: [apps/api/src/config/env.schema.test.ts, apps/api/src/config/app-config.service.test.ts]
relatedDocs: [docs/env-vars.md, rules/25-configuration-and-environment.md, structure/runtime-topology.md]
readWhen: You are adding, renaming, or consuming an environment variable on either side.
---

# Configuration Map — Where Config Lives on Each Side

The variable-by-variable catalog (name, purpose, bounds, defaults) is owned by
[docs/env-vars.md](../docs/env-vars.md); this page maps the **structure**: which file defines,
validates, and exposes configuration, and what must move together.

## Backend (`apps/api`)

| Concern | File | Facts |
| --- | --- | --- |
| Schema (single source of truth) | `apps/api/src/config/env.schema.ts` | Every env var defined once in a zod schema; `validateEnv` **crashes startup** on invalid config; a `superRefine` enforces `STREAM_TTL_MS >= ANALYSIS_TIMEOUT_MS` |
| Numeric bounds | `apps/api/src/config/env-bounds.constants.ts` | All MIN/MAX/DEFAULTs; cross-side values (upload cap, share TTL window) are re-exported aliases from `@twinzy/shared` so the sides cannot drift |
| Module wiring | `apps/api/src/config/config.module.ts` | `@Global()`, env-file order `apps/api/.env` then repo-root `.env` (process.env wins), `cache: true`, `validate: validateEnv` |
| The only injectable surface | `apps/api/src/config/app-config.service.ts` | Typed getters incl. `isPaywallEnabled` (ON iff BOTH `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` non-empty), `swaggerEnabled` (default `!isProduction`), per-step AI route/model-chain resolution, `paymentPrice` |
| AI step/provider constants | `apps/api/src/config/gemini-step.constants.ts`, `ai-provider.constants.ts`, `ai-route.util.ts` | `AI_IMAGE_STEPS = [Extraction]` (the fail-closed image-step policy), provider env-key maps, `AI_ROUTE_*` parsing that throws at startup on bad tokens |
| AI parallel-pipeline knobs (flag-gated, OFF) | `apps/api/src/config/env.schema.ts` (+ `env-bounds.constants.ts`), `app-config.service.ts` getters | The six `AI_PARALLEL_PIPELINE_ENABLED` / `AI_GENERATION_LANES` / `AI_GENERATION_CONCURRENCY` / `AI_JUDGE_CONCURRENCY` / `AI_MAX_CALLS_PER_ANALYSIS` / `AI_PARALLEL_QUEUE_TIMEOUT_MS` knobs; default OFF, consumed by `AiStepConcurrencyGate` / `CandidateRecallService` — detail in [docs/ai/concurrency-policy.md](../docs/ai/concurrency-policy.md) |
| Payment constants | `apps/api/src/config/payment.constants.ts` | `PAYPAL_ENV_VALUES`, sandbox/live base URLs |

Rules: `process.env` is read only in `src/config` (schema) and the one pre-DI exception
`apps/api/src/bootstrap/fastify-adapter.ts` (`TRUST_PROXY`). Nothing outside `src/config`
imports `@nestjs/config`. Enforced by `eslint/architecture-plugin/rules/no-direct-env-access.mjs`
(see [layer-map.md](layer-map.md)).

## Frontend (`apps/web`)

| Concern | File | Facts |
| --- | --- | --- |
| The only sanctioned client `process.env` reader | `apps/web/src/packages/env/public-env.ts` | Zod-validated `publicEnv`: `appEnv`, `apiBaseUrl` (default `http://localhost:4000`), `paypalMeUsername` (strict pattern), `paypalClientId` (the paywall switch), `paymentPriceValue`/`paymentPriceCurrency` (**display-only mirrors** of the server-authoritative price), `isDevRuntime` |
| Ambient declarations | `apps/web/src/packages/env/env.d.ts`, `apps/web/src/types/env.d.ts` | `NEXT_PUBLIC_*` key declarations |
| Build-time wiring | `apps/web/next.config.ts` | Copies root-`.env` `NEXT_PUBLIC_*` keys into the process; wires next-intl; static security headers |
| Runtime security config | `apps/web/src/proxy.ts` + `apps/web/src/shared/security/content-security-policy.ts` | CSP built per-request from `{nonce, isDevRuntime, apiBaseUrl, paypalClientId}`; PayPal origins only when the paywall client id is set |

Enforced by `eslint/frontend-architecture-plugin/rules/no-process-env-outside-config.mjs`.

## Shared and templates

- `.env.example` (repo root) — the template; when it changes, local `.env` must be updated too
  (standing memory note in the user's memory index).
- Cross-side defaults (upload cap, share TTL/payload/active-items) live in
  `packages/shared/src/constants/` and are aliased by `env-bounds.constants.ts` — change them
  in shared first ([modules/shared.md](modules/shared.md)).

## When adding or changing a variable (checklist pointer)

Per [rules/25-configuration-and-environment.md](../rules/25-configuration-and-environment.md)
and the Mandatory Change Checklist in [CLAUDE.md](../CLAUDE.md), a config change must touch
together: `env.schema.ts` (+ bounds), `app-config.service.ts` getter, `.env.example`,
[docs/env-vars.md](../docs/env-vars.md), `docker-compose.yml` environment block when the
container needs it, and the tests `apps/api/src/config/env.schema.test.ts` /
`app-config.service.test.ts` (frontend: `public-env.ts` + `env.d.ts` + Playwright webServer env
in `apps/web/playwright.config.ts` when e2e-relevant).
