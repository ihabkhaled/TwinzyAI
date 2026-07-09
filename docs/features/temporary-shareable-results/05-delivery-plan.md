# 05 - Delivery Plan

- Request ID: TWZ-SHARE-001
- Feature: temporary-shareable-results
- Date: 2026-07-08
- Owner / approver: Ihab (product + engineering)
- Track: standard (major feature; new public surface + in-memory payload caching; no AI-pipeline change)

## Purpose

Convert the TWZ-SHARE-001 request (a temporary, no-DB, UUID-addressed share link with a live countdown and a multi-platform share modal) into a practical delivery plan with milestones, sequencing, dependencies, and approvals.

## Step-by-Step Workflow

1. Work broken into 8 workstreams (below), all owned by Ihab — solo delivery, so ownership is uniform but sequencing is strict.
2. Sequenced contracts-and-config first: `packages/shared` schemas + config env → cache port + in-memory adapter → backend endpoints → frontend page/modal → validation/docs → release. Each milestone lands as reviewable commits with tests in the same slice.
3. Dependencies and blockers identified below; there is no external service dependency (no Redis today).
4. No feature flag, no staged rollout, no migrations or backfills (stateless, no DB). `SHARE_RESULT_CACHE_DRIVER` selects the adapter (`memory` now).
5. Owners defined per workstream (all Ihab).

## Delivery Summary

Standard-track delivery in seven sequential milestones. Shared contracts and config land first (`packages/shared` share-create/read/UUID schemas reusing `FinalGameResultSchema`; five zod-validated env vars with bounds + accessors). The `ShareResultCachePort` and its bounded in-memory TTL adapter (lazy expiry + sweeper + `OnModuleDestroy` cleanup + item/byte caps) land next, followed by the backend module (thin controller + create/read/delete use-cases + a validation/safety service that re-filters and rejects image-like content), then the frontend (public `/share/[shareId]` route importing a container from `modules/game`, a countdown hook, all page states, and the share modal wired into the result screen), and finally validation and docs. Web and API ship together from the same monorepo release. Release is a single atomic deploy; rollback is `git revert` of the feature commits — no data migrations exist, and a redeploy also clears the in-memory cache.

## Work Breakdown

| Workstream | Scope | Owner | Notes |
| --- | --- | --- | --- |
| Backend (`apps/api`) | New `modules/share-results` (api/application/infrastructure/model/lib/tests): thin controller (`POST`/`GET`/optional `DELETE` under `/api/v1/share-results`); create use-case (validate `FinalGameResult` → re-safety-filter → reject image/base64/`data:` → byte cap → mint UUID → compute `expiresAt` → store → return `{shareId, shareUrl, createdAt, expiresAt, ttlSeconds}`); read use-case (validate UUID → active record or safe not-found/expired); delete use-case (idempotent); `ShareResultCachePort` + DI token; bounded in-memory TTL adapter; `lib` helpers (share-id, expiry, url); throttler config | Ihab | No image ever accepted; JSON-only; `AppError`/`messageKey`; raw cache client only inside the adapter |
| Frontend (`apps/web`) | Public route `app/share/[shareId]/page.tsx` (imports container from `@/modules/game`, `noindex/nofollow` + generic safe OG); inside `modules/game`: public share-result container (loading/active/expired/not-found), 1-second countdown hook (from server `expiresAt`, cleaned up on unmount), share modal (Web Share API + copy-link + WhatsApp/Telegram/Facebook/X/LinkedIn/Email/Reddit URL-encoded), share-target helpers; wire the result screen's "Share result" to create a link + open the modal | Ihab | Reuses existing result components; never renders the image; no `dangerouslySetInnerHTML`; RTL/dark/mobile-first (320–414px); en/ar strings |
| Shared contracts (`packages/shared`) | `shareId` UUID schema; create-request (reuse `FinalGameResultSchema`); create-response + read-response schemas; derived types; all Zod `strict()`, no `enum`, no inline defs | Ihab | Lands first — both apps compile against it |
| Config (`apps/api/src/config`) | `SHARE_RESULT_TTL_SECONDS` (600, 60–3600), `SHARE_RESULT_CACHE_DRIVER` (`memory`), `SHARE_RESULT_MAX_PAYLOAD_BYTES` (50000), `SHARE_RESULT_MAX_ACTIVE_ITEMS` (1000), `SHARE_RESULT_PUBLIC_BASE_URL` (`http://localhost:3000`) — schema + bounds + typed accessors; `.env.example` update | Ihab | Fail-fast on invalid config; only config reads `process.env` |
| QA | Unit/integration/e2e/architecture per `11-test-strategy.md`: cache TTL/eviction/caps/cleanup, expiry helpers, image/base64 rejection, endpoint happy/abuse paths, countdown + page states, modal encoding, no-image assertions, create→open-in-fresh-context→expired e2e | Ihab | Tests-first per slice; deterministic clock for TTL/countdown; coverage 95/90/95/95 on touched modules |
| Security / privacy | Threat model additions: public-by-link exposure, unbounded-memory DoS, image smuggling on ingest, UUID guessing, output injection on the page. Controls: crypto UUID, TTL + caps, image rejection, `noindex/nofollow`, safe OG, escaping, rate limits, redacted logs | Ihab | Phase 19 threat model + review before release |
| Docs | README "How it works"/sharing, `docs/architecture.md` + `context/architecture-map.md` (new module + cache port), `docs/privacy-and-data-retention.md` (temporary in-memory retention + public-by-link risk + Redis-later note), `docs/env-vars.md`, `memory/` (cache-port + Redis-later decision), this feature's artifact set | Ihab | Same delivery stream as the code |
| Release / ops | Full gate suite (lint 0/0, typecheck, `test:unit`, `test:integration`, `test:e2e`, `test:coverage`, `test:pwa`, build, `validate`, `quality:dead-code`, `quality:circular`, `security:scan`); smoke test create→open→countdown→expired; rollback = revert feature commits | Ihab | Stateless app — no migration/backfill in release or rollback; set `SHARE_RESULT_PUBLIC_BASE_URL` per env |

## Milestones

| Milestone | Goal | Entry criteria | Exit criteria | Target date |
| --- | --- | --- | --- | --- |
| M1 — Shared contracts + config | Share schemas in `packages/shared`; five env vars in the typed config | Artifacts 00–13 documented and approved | Schemas + config merged; lint/typecheck/unit green; `.env.example` updated; no `enum`, no inline defs; fail-fast validation proven | 2026-07-09 |
| M2 — Cache port + adapter | `ShareResultCachePort` + bounded in-memory TTL adapter | M1 done | Unit tests green: TTL lazy expiry + sweeper, `OnModuleDestroy` cleanup, item-cap + byte-cap rejection; raw client only inside adapter | 2026-07-10 |
| M3 — Backend endpoints | `POST`/`GET`/optional `DELETE` live behind throttler | M2 done | Integration green: create→read→expire; image/base64/oversized/capacity rejected; unknown/malformed UUID safe; 429 on abuse; delete idempotent; thin controller | 2026-07-11 |
| M4 — Frontend page + modal | Public share page + countdown + share modal on result screen | M3 done | Component tests green: countdown ticking/zero/cleanup, all page states, modal targets encoded, no image rendered, no `dangerouslySetInnerHTML`; RTL/dark/320–414px; `noindex/nofollow` + safe OG | 2026-07-14 |
| M5 — E2E + a11y | Full share journey validated | M4 done | e2e create→open-in-fresh-context→countdown→expired; a11y smoke on modal + page; `test:pwa` green | 2026-07-15 |
| M6 — Validation & docs | All gates green, docs current | M5 done | `npm run validate` suite green; coverage 95/90/95/95 on touched modules; knip/madge/trivy clean; artifacts 15–19 filled | 2026-07-16 |
| M7 — Release & hypercare | Ship and observe | M6 done; go/no-go GO recorded | 25-release-report + smoke (create→open→countdown→expired, rate-limit responding); 26-hypercare window closed healthy (cache size bounded, no leaks) | 2026-07-17 |

## Dependencies and Blockers

| Dependency or blocker | Type | Owner | Mitigation |
| --- | --- | --- | --- |
| `FinalGameResultSchema` remains the create contract | Internal contract | Ihab | Reused unchanged; both apps compile against `packages/shared` |
| Typed config layer accepts five new env vars, fail-fast | Internal | Ihab | Follow existing `env.schema.ts` + `env-bounds.constants.ts` + `app-config.service.ts` pattern; `.env.example` synced |
| In-memory cache must never grow unbounded | Technical risk | Ihab | Item cap + byte cap + TTL + sweeper + `OnModuleDestroy`; creates rejected at capacity with a safe error; unit-tested |
| Frontend circular-module risk (share ↔ game) | Internal sequencing | Ihab | Share code lives inside `modules/game`; route imports the container; madge (`quality:circular`) enforces no cycle |
| Public-by-link exposure | Security / privacy | Ihab | Crypto UUID, short TTL, `noindex/nofollow`, safe OG, nothing identifying; documented accepted risk |
| `SHARE_RESULT_PUBLIC_BASE_URL` correct per environment | Config / ops | Ihab | Documented in env-vars + release runbook; wrong value only affects link host, never data safety |
| E2E/browser environment constraints on the dev machine | Environment | Ihab | If a run is blocked, document the exact blocker in `15-dev-validation-report.md` rather than skipping silently |
| Artifacts 00–13 must be complete before implementation | Governance gate | Ihab | Sibling artifacts authored in the same delivery stream; hard gate before Phase 14 |

## Rollout Strategy

- Feature flag needed: no — the change ships atomically; the endpoints are new and additive, and revert restores the prior behavior cleanly (stateless, no stored data to reconcile).
- Staged rollout needed: no — single deployment of a free, anonymous, no-tenant app; there is no cohort to stage by.
- Contract change in `packages/shared` needed: yes — new share-create/read/UUID schemas (additive; reuse `FinalGameResultSchema`). Web and API deploy together from one monorepo release, so no cross-version compatibility window is required; the web app is the only API consumer.
- Env/config change needed: yes — five new variables (`SHARE_RESULT_TTL_SECONDS`, `SHARE_RESULT_CACHE_DRIVER`, `SHARE_RESULT_MAX_PAYLOAD_BYTES`, `SHARE_RESULT_MAX_ACTIVE_ITEMS`, `SHARE_RESULT_PUBLIC_BASE_URL`), all with safe defaults; `.env.example` and local `.env` updated in the same slice.
- Communication plan needed: Not applicable — solo owner, no external stakeholders or client comms (accepted by Ihab).

(There are no database migrations or backfills in this repository — Twinzy has no database. The only "state" is a short-lived, self-deleting in-memory record.)

## Required Approvals

- [x] Product approval — Ihab, 2026-07-08
- [x] Engineering approval — Ihab, 2026-07-08
- [x] Architecture approval — Ihab, 2026-07-08 (see `08-architecture-review.md`)
- [ ] Security approval — Ihab, at Phase 19 gate (threat model + review of the public surface, ingest safety, and memory bounds)
- [ ] QA approval — Ihab, at Phase 17 gate
- [ ] Release approval — Ihab, at Phase 22 go/no-go
- Client approval: Not applicable — free personal product, no external client or contract (accepted by Ihab)

## Risks

- Public-by-link exposure — mitigated by crypto UUID, short TTL, `noindex/nofollow`, generic safe OG, nothing identifying; documented accepted risk.
- Unbounded memory growth (DoS) — mitigated structurally by item + byte caps, TTL + sweeper, `OnModuleDestroy`, and capacity rejection.
- Image content smuggled into the share payload — mitigated by strict schema + explicit image/base64/`data:` rejection + safety re-filter on ingest; tests assert no image anywhere.
- Multi-instance / restart drops live links early (memory adapter) — accepted for the current single-instance deployment; Redis path documented for scale.
- Frontend circular dependency — mitigated by placing share code inside `modules/game`; enforced by madge.
- E2E/browser environment constraints may block a full local run — mitigated by documenting the exact blocker if execution is prevented.

## Exit Checklist

- [x] Workstreams identified
- [x] Sequence defined
- [x] Dependencies documented
- [x] Risks documented
- [x] Approval needs documented

## Evidence And References To Attach

- Sibling artifacts: `docs/features/temporary-shareable-results/00-intake.md` through `13-implementation-readiness.md` (same delivery stream)
- Reused contract + safety canon: `packages/shared/src/schemas/game-result.schema.ts`, `packages/shared/src/constants/safety.constants.ts`
- Config + throttle patterns: `apps/api/src/config/*`, `apps/api/src/modules/game/model/game.constants.ts`
- Gate commands of record: `npm run lint` · `npm run typecheck` · `npm run test:unit` · `npm run test:integration` · `npm run test:e2e` · `npm run test:coverage` · `npm run test:pwa` · `npm run build` · `npm run validate` · `npm run quality:dead-code` · `npm run quality:circular` · `npm run security:scan`
- Release window: single atomic deploy targeted 2026-07-17; no external coordination required

## Phase Blockers

None open. Sequencing is explicit (M1–M7), every dependency has an owner (Ihab), rollout/rollback is defined (atomic deploy, `git revert`, no migrations, redeploy clears cache), and the path from plan to release is the milestone table above. This phase is closed as of 2026-07-08.
