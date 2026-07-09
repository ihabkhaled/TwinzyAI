# 08 - Architecture Review

- **Request ID:** TWZ-SHARE-001 · **Feature:** temporary-shareable-results · **Date:** 2026-07-08 · **Owner:** Ihab · **Track:** standard (new public surface + in-memory payload caching; no AI-pipeline change)

## Purpose

Verify that the planned solution fits the current architecture or intentionally evolves it with documented decisions.

## Step-by-Step Workflow

1. Re-read architecture canon: `context/architecture-map.md`, `rules/01-architecture.md`, `rules/16-backend-architecture.md`, existing ADRs in `architecture/adrs/` (`adr-001-strict-engineering-os.md`, `adr-002-zod-validation-vendor.md`, `adr-fe-0001-strict-next-architecture.md`) — done 2026-07-08.
2. Compared the share design (cache port + in-memory TTL adapter, three additive endpoints, public route, share modal) against the layered anatomy, the wrapped-vendor/adapter rule, the config-only-`process.env` rule, and shared Zod contracts — done; findings below.
3. Contract, ownership, data-flow, and topology changes identified — see Architecture Impact.
4. ADR decision recorded — see Required ADRs.

## Current Architecture Context

npm-workspaces monorepo: `apps/api` (NestJS 11 + Fastify, stateless, **no DB by design**), `apps/web` (Next.js App Router, next-intl `en`/`ar`, TanStack Query), `packages/shared` (Zod `strict()` schemas, `as const` value objects, safety constants — single source of truth for cross-side contracts).

Relevant existing seams this feature builds on:

- Backend modules follow a one-way layered anatomy: thin controller (`api/*.controller.ts`, one delegation per method) → use-case/service (`application/`) → domain → `infrastructure/*` and `adapters/*` (every external library wrapped). Only `apps/api/src/config` reads `process.env` (zod-validated, fail-fast). Per-route throttling is `@nestjs/throttler` `as const` objects (`ANALYZE_THROTTLE`, `TRANSLATE_THROTTLE`). Errors are `AppError` + `messageKey`.
- `packages/shared/src/schemas/game-result.schema.ts` defines `FinalGameResultSchema` (the exact result contract) and `constants/safety.constants.ts` defines the forbidden phrases/topics — both reused here.
- Frontend `apps/web/src/app` holds App Router routes directly (no locale segment); `apps/web/src/modules/game` holds the game feature (Component → Hook → Service → Gateway) with existing result components and an existing `useShareResult` clipboard hook. HTTP flows only through gateway/`packages/axios`.

All share work extends these exact seams; the one genuinely new concept is a **temporary in-memory cache abstracted behind a port**, which the ADR below records.

## Architecture Impact

| Area | Impact | Notes |
| --- | --- | --- |
| Domain boundaries | **New module (additive)** | New `apps/api/src/modules/share-results` (`api`/`application`/`infrastructure`/`model`/`lib`/`tests`). It reuses `FinalGameResult` from `packages/shared` but has **no cross-module internal import** into `modules/game` or `modules/ai`. The AI pipeline is untouched. |
| Service ownership | Ihab (unchanged, single owner) | Focused services follow the ≤20-line-method rule: create/read/delete use-cases + a validation/safety service; a thin controller with one delegation per endpoint. |
| API contracts | **Changed — additive** | Three new routes under `/api/v1/share-results` (`POST`, `GET /:shareId`, optional `DELETE /:shareId`). Two new shared response schemas + a `shareId` UUID schema; the create request **reuses `FinalGameResultSchema`**. No existing route or contract changes. Only consumer is our own frontend, shipped in the same monorepo release. |
| Data flow | **New, invariant-safe** | Result screen → `POST` create (validate + re-safety-filter + reject image/base64/`data:` + byte cap → UUID → `expiresAt` → store in the TTL cache) → return `shareUrl` + timing. Public page → `GET /:shareId` (lazy-expiry check → active record or safe not-found). **No image ever enters this flow** (none is accepted, stored, returned, or rendered); only the already-validated, safety-filtered `FinalGameResult` transits. |
| Event flow | Minimal | No queues/jobs. One internal periodic sweeper timer inside the cache adapter, torn down in `OnModuleDestroy`. |
| Deployment topology | **None** | No new deployable unit, no DB, no Redis, no storage. Three new routes on the existing Fastify app; two `@nestjs/throttler` route limits; five new zod-validated env vars. |
| Shared libraries or modules | Additive growth | `packages/shared`: `shareId` UUID schema + create/read response schemas (Zod `strict()`, derived types, no `enum`, no inline defs). `apps/api/src/config`: five env vars + bounds + accessors. Frontend: share code (create mutation, modal, public-page container, countdown hook, share-target helpers) added **inside** `modules/game` to reuse result components and avoid a circular module dependency; the route file only imports the container. |

## Design Pattern Fit

The proposal is an additive module plus a new-but-conventional storage abstraction, not an architectural departure:

- **Wrapped vendor / adapter rule:** the in-memory store (a `Map`) lives only inside the `infrastructure` TTL adapter; the rest of the module depends on `ShareResultCachePort` (interface + DI token). This is exactly how the codebase wraps external state/vendors — and it makes Redis/Valkey a drop-in later with no call-site churn. A future Redis client would likewise be confined to its adapter.
- **Config-only `process.env`:** all five caps/URLs go through `apps/api/src/config` (zod, fail-fast, typed accessors); no service reads env directly.
- **Contracts shared-first:** every new shape is a bounded Zod `strict()` schema in `packages/shared` with derived types; no inline schemas in controllers/services. The create request reuses the existing `FinalGameResultSchema` rather than duplicating it.
- **Thin transport:** the controller has one delegation per endpoint; validation, safety re-filtering, UUID checks, and orchestration live in the use-cases/service.
- **Frontend anatomy (`adr-fe-0001`):** the public page is a route file that composes a container from `modules/game`; HTTP goes through a gateway; countdown/effect logic is in a hook; the share modal is a component fed ready-to-render values. Placing share code inside `modules/game` (not a new `modules/share`) is a deliberate choice to reuse result components and keep the dependency graph acyclic (madge-enforced).
- **Safety defense-in-depth:** the shared payload is validated **and** re-safety-filtered on ingest, image-like content is explicitly rejected, and the page escapes all text (no `dangerouslySetInnerHTML`) — the safety net is preserved end to end.

Intentional deviations from current patterns: **one** — the introduction of a server-side ephemeral cache. It is intentionally bounded (TTL + sweeper + `OnModuleDestroy` + item/byte caps) and abstracted behind a port so it does not become an unmanaged stateful component. Recorded as an ADR below.

## Required ADRs

| ADR needed | Title | Owner | Status |
| --- | --- | --- | --- |
| yes | adr-004-ephemeral-share-result-cache-port.md — a temporary, no-DB share store behind `ShareResultCachePort` with a bounded in-memory TTL adapter now and Redis/Valkey documented as the production adapter (chosen over URL-encoded client-only sharing and over a database); records the memory-only/multi-instance limitation and the invariant that only the safety-filtered `FinalGameResult` — never an image — is cached | Ihab | pending (write with phase 14) |
| no | New additive endpoints, the `shareId`/response schemas, and the frontend page/modal need no separate ADR: additive within existing boundaries, covered by adr-001/adr-002/adr-fe-0001 patterns | Ihab | decided |

## Architecture Risks

- **Public-by-link exposure** — mitigated by crypto-random UUID (unguessable), short TTL, `noindex/nofollow`, generic safe Open Graph (no result specifics, no image), rate-limited read, and a payload that identifies no one. Accepted, documented.
- **Unbounded memory / DoS** via the cache — mitigated structurally: max-active-items + max-payload-bytes caps (reject creates at capacity), TTL with lazy expiry + a sweeper, and `OnModuleDestroy` teardown. This is a stateful component, so bounds are an architectural requirement, not optional hygiene.
- **Image content smuggled into the share payload** — mitigated by strict `FinalGameResultSchema` (unknown keys rejected), an explicit image/base64/`data:` rejection step, and the safety re-filter on ingest; tests assert no image anywhere in payload/cache/response/page.
- **Frontend circular dependency** (a naive `modules/share` importing game's result components) — avoided by placing share code inside `modules/game`; enforced by madge (`quality:circular`).
- **Storage-mechanism leakage across layers** — avoided by the port + adapter; the raw `Map` is confined to `infrastructure` (architecture test).
- **Memory-only limitation** (restart/deploy or multi-instance drops links early) — accepted for the current single-instance deployment; Redis path documented; the port means no refactor is needed to adopt it.
- **E2E/browser environment constraints** may limit full-flow automated evidence on this machine — residual risk tracked in `11-test-strategy.md`; deterministic fake-clock component tests compensate for the countdown/expiry.

## Exit Checklist

- [x] Architecture docs reviewed (`context/architecture-map.md`, rules 01/16, ADRs 001/002/fe-0001)
- [x] Impact documented (table above)
- [x] Pattern fit documented (one intentional deviation: the ephemeral cache, recorded as adr-004)
- [x] ADR decision made (adr-004 required, pending authoring in phase 14)
- [x] Risks captured

## Sign-Off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Architect / technical owner | Ihab | approve | 2026-07-08 |

## Evidence And References To Attach

- Canon: `context/architecture-map.md`, `rules/01-architecture.md`, `rules/16-backend-architecture.md`, `rules/14-ai-safety.md`
- ADRs: `architecture/adrs/adr-001-strict-engineering-os.md`, `adr-002-zod-validation-vendor.md`, `adr-fe-0001-strict-next-architecture.md`; new `adr-004` to be added
- Reused contract + safety canon: `packages/shared/src/schemas/game-result.schema.ts`, `packages/shared/src/constants/safety.constants.ts`
- Config + throttle patterns: `apps/api/src/config/*`, `apps/api/src/modules/game/model/game.constants.ts`
- Affected boundaries: `apps/api/src/modules/share-results` (new), `apps/api/src/config`, `packages/shared/src/schemas`, `apps/web/src/app/share/[shareId]`, `apps/web/src/modules/game`
- Related artifacts: `docs/features/temporary-shareable-results/09-impact-analysis.md`, `11-test-strategy.md`

## Phase Blockers

Do not close this phase if:

- architecture fit is assumed but not explained — explained above; fit confirmed with one recorded deviation (the ephemeral cache)
- ownership changes are still implicit — none; single owner (Ihab)
- an ADR is needed but was deferred without a decision — decided: adr-004 required, owner Ihab
- cross-boundary effects are still unclear — enumerated in Architecture Impact; the new module has no cross-module internal import, and the AI pipeline is untouched

No blockers remain; phase closed 2026-07-08.
