# 13 - Implementation Readiness

- Request ID: TWZ-SHARE-001 — temporary-shareable-results
- Date: 2026-07-08
- Owner: Ihab (product + engineering)
- Track: standard (new public surface + in-memory payload caching; no AI-pipeline change)

## Purpose

Prepare the team and the system to implement safely.

## Step-by-Step Workflow

1. Confirm phases `00` through `12` are complete enough to begin.
2. Prepare branch strategy and change slices.
3. Prepare flags, migrations, rollback, and observability.
4. Prepare test scaffolding and review checklists.
5. Confirm release controls and approvers are ready.

Status: phases 00–12 for TWZ-SHARE-001 are documented in this folder; repo canon read (`CLAUDE.md`, `context/architecture-map.md`, `rules/00-non-negotiable-rules.md`, `rules/14`/`16`/`12`/`13`, config canon `apps/api/src/config/*`, the reused `FinalGameResultSchema` and `safety.constants.ts`, the throttle pattern in `game.constants.ts`, and the existing frontend `modules/game` result components + `useShareResult.hook.ts`). Affected code and its tests read before change.

## Readiness Checklist

### Delivery Setup

- [x] Branch strategy defined — work on `main` (repo convention), conventional commits per slice via Husky hooks; every commit keeps all gates green (lint 0/0, tsgo typecheck, coverage 95/90/95/95 on touched modules, knip, madge, trivy, `test:pwa`).
- [x] Work is sliced into reviewable increments:
  1. `packages/shared` + `apps/api/src/config` — `shareId` UUID schema, create-request (reuse `FinalGameResultSchema`), create-response (`shareId`, `shareUrl`, `createdAt`, `expiresAt`, `ttlSeconds`) and read-response (`shareId`, `languageCode`, `result`, `createdAt`, `expiresAt`, `remainingSeconds`) schemas; five env vars (`SHARE_RESULT_TTL_SECONDS` 600/60–3600, `SHARE_RESULT_CACHE_DRIVER` `memory`, `SHARE_RESULT_MAX_PAYLOAD_BYTES` 50000, `SHARE_RESULT_MAX_ACTIVE_ITEMS` 1000, `SHARE_RESULT_PUBLIC_BASE_URL` `http://localhost:3000`) with bounds + typed accessors; `.env.example` updated. All Zod `.strict()`, `as const`, no `enum`, no inline defs.
  2. `apps/api/src/modules/share-results` cache layer — `ShareResultCachePort` (interface + DI token) + stored-record type in `model`; a bounded in-memory TTL adapter in `infrastructure` (private `Map`, lazy expiry on read, periodic sweeper, `OnModuleDestroy` cleanup, max-active-items + max-payload-bytes rejection); pure `lib` helpers (share-id via `crypto.randomUUID`, `computeExpiresAt`/`remainingSeconds`/`isExpired`, share-url builder).
  3. Backend endpoints — thin `share-results.controller.ts` (`POST`/`GET`/optional `DELETE` under `/api/v1/share-results`, one delegation each) + DTOs; create use-case (validate → re-safety-filter → reject image/base64/`data:` → byte cap → mint UUID → `expiresAt` → store → `shareUrl`); read use-case (validate UUID → active or safe not-found/expired); delete use-case (idempotent); `SHARE_CREATE_THROTTLE` + `SHARE_READ_THROTTLE` `as const`; module registration. `AppError`/`messageKey` only; metadata-only logs.
  4. Frontend public page — `app/share/[shareId]/page.tsx` (`noindex, nofollow` + generic safe Open Graph; imports the container from `@/modules/game`); inside `modules/game`: public share-result container (loading/active/expired/not-found), gateway read call, a 1-second countdown hook from server `expiresAt` (cleared on unmount, expired transition at zero), reuse of existing result components, and a "Create your own result" call-to-action on every state. Never renders the image; no `dangerouslySetInnerHTML`; en/ar; RTL/dark/mobile-first.
  5. Frontend share modal + wiring — share modal (Web Share API first; fallback copy-link + WhatsApp/Telegram/Facebook/X/LinkedIn/Email/Reddit URL-encoded; UUID-only URL; localized text; candidate names untranslated) + share-target helpers + a create-link mutation; wire the result screen's "Share result" to create a link and open the modal (complementing the existing `useShareResult` clipboard path).
  6. Docs + memory — README "How it works"/sharing, `docs/architecture.md` + `context/architecture-map.md` (new module + cache port), `docs/privacy-and-data-retention.md` (temporary in-memory retention, public-by-link risk, restart/multi-instance limitation, Redis-later path), `docs/env-vars.md` (five vars), `memory/known-pitfalls.md`, and `architecture/adrs/adr-004-ephemeral-share-result-cache-port.md`.
- [x] Owners are assigned — Ihab owns all slices, review, and release.

### Flags and Configuration

- [x] Feature flag plan documented — no runtime flag. The endpoints and page are new and additive; rollback is a commit revert, not a toggle. `SHARE_RESULT_CACHE_DRIVER` selects the adapter (`memory` now; `redis` reserved additively).
- [x] Env/config changes identified — five new variables (all with safe defaults) added to the typed, zod-validated, fail-fast config (`env.schema.ts` + `env-bounds.constants.ts` + `app-config.service.ts`); `.env.example` updated in the same slice, and local `.env` synced per the memory note. `SHARE_RESULT_PUBLIC_BASE_URL` must be set to the real host per environment.
- [x] Secret changes identified — none. No new credentials; no API keys involved (sharing does not call the AI provider).

### Contracts and Rollback

- [x] Shared contract changes (`packages/shared`) planned with web-client compatibility — three additive share schemas; the create request reuses `FinalGameResultSchema` unchanged. API and web are updated in the same delivery stream and deploy together; there are no external API consumers and no stored data, so no dual-shape compatibility window is needed.
- [x] Rollback plan documented — `git revert` of the feature commits + redeploy. No DB, no migrations, no persisted data. The routes are additive (revert removes them cleanly), and a redeploy also clears the in-memory cache, so no records survive the rollback.

### Observability

- [x] Log entries identified — structured pino logs, request-id correlated, metadata only: share create/read/delete outcomes, cache item count, evictions, TTL expiries, capacity rejections, rate-limit hits, and per-request durations. **Never** log result content, raw payloads, or image data (none exists).
- [x] Error codes / message keys identified — invalid/oversized/forbidden-wording/image-like body → validation `messageKey`; cache capacity → safe "try later" `messageKey`; unknown/malformed/expired UUID → safe not-found `messageKey`; rate limit → 429. All errors are `AppError` + `messageKey`; no stack traces or provider errors leak.
- [x] Log inspection path confirmed — `docker compose logs` / pino JSON, unchanged from current operations; new counters (cache size, evictions) watched during hypercare.

### Quality and Review

- [x] Test scaffolding ready — planned per 11/12: shared schema tests (UUID accept/reject; create/read shapes; `FinalGameResult` reuse); cache adapter tests (TTL lazy expiry + sweeper, `OnModuleDestroy` cleanup, item/byte-cap rejection, delete idempotency) under a controlled clock; use-case tests (create validation + safety re-filter + image rejection + byte cap; read active/not-found/expired; safe error mapping); config tests (fail-fast on out-of-bounds); frontend component tests (countdown ticking/zero/cleanup, page states, modal encoding, no-image, escaping, RTL); e2e (create→open-in-fresh-context→countdown→expired; not-found; mobile; a11y) — noting the known e2e/browser environment constraint from 09/11.
- [x] Review checklist ready — `docs/sdlc/code-review-checklist.md`, `rules/23-review-checklist.md`; the new public surface + payload caching get the deeper security/privacy review per `rules/14` and phase 19.
- [x] Gates known: `npm run lint` · `npm run typecheck` · `npm run test:unit` · `npm run test:integration` · `npm run test:e2e` · `npm run test:coverage` · `npm run test:pwa` · `npm run build` · `npm run validate` · `npm run quality:dead-code` · `npm run quality:circular` · `npm run security:scan`.

### Release Control

- [x] Rollout strategy documented — single atomic release of API + web from `main` after all gates are green; no staged rollout needed (stateless free game, no accounts, no data migration). Set `SHARE_RESULT_PUBLIC_BASE_URL` per environment. Post-deploy smoke: create a link → open it in a fresh context → confirm results/countdown/disclaimer, no image shown, unknown UUID safe, create/read rate limits responding.
- [x] Release approvers identified — Ihab (technical owner and release owner; solo-maintainer role mapping recorded in the approval workflow).
- [x] Hypercare owner identified — Ihab; watch cache item count / growth (must stay bounded), TTL-expiry and eviction rates, capacity-rejection and 429 rates, and any create/read error spikes after release.

## Readiness Gaps

| Gap | Owner | Resolution date | Status |
| --- | --- | --- | --- |
| E2E/browser environment constraints may block full Playwright runs locally (open link in a fresh context, watch the countdown, reach expiry); if so, record the exact blocker and the deterministic fake-clock component substitute in 15-dev-validation-report.md | Ihab | during phase 15 | open (accepted, non-blocking for start) |
| Memory-only cache limitation: a restart/deploy or a future multi-replica deployment drops live links early; mitigated by design (short TTL, documented behavior) and the Redis path behind `ShareResultCachePort`; live behavior confirmed in hypercare | Ihab | phase 26 | open (mitigated by design / documented) |

## Go / Hold Decision

- Decision: **go**
- Reason: phases 00–12 are documented; every product invariant is preserved and enforced by design (free game; no DB/auth/payments/accounts; **no image bytes/url/hash/metadata/embeddings** anywhere — image/base64/`data:` content is rejected on ingest; only the already-validated, safety-filtered `FinalGameResult` is cached; playful visual-similarity wording only, re-safety-filtered; no `enum`; no inline defs); the cache is hard-bounded and self-reclaiming behind a port (TTL + sweeper + `OnModuleDestroy` + item/byte caps), so memory cannot grow unbounded; all timing/caps/URLs are config-driven and fail-fast; the public surface is hardened (crypto UUID, short TTL, `noindex/nofollow`, safe OG, rate limits, escaping); no secret or migration work exists; rollback is a plain revert that also clears the cache; both open gaps have owners and mitigations and do not block a safe implementation start.

## Sign-Off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Technical owner | Ihab | approve | 2026-07-08 |
| Release owner if applicable | Ihab | approve | 2026-07-08 |

## Evidence And References To Attach

- Phase artifacts `00`–`12` in `docs/features/temporary-shareable-results/`.
- Branch/config: `main`, conventional commits; `.env.example` gains `SHARE_RESULT_TTL_SECONDS`, `SHARE_RESULT_CACHE_DRIVER`, `SHARE_RESULT_MAX_PAYLOAD_BYTES`, `SHARE_RESULT_MAX_ACTIVE_ITEMS`, `SHARE_RESULT_PUBLIC_BASE_URL`.
- Contract/rollback: `packages/shared/src/schemas/game-result.schema.ts` (`FinalGameResultSchema` reused), new share schemas; rollback = revert feature commits (no migrations exist; redeploy clears the cache).
- Reused patterns: `apps/api/src/config/*` (typed config), `apps/api/src/modules/game/model/game.constants.ts` (throttle pattern), `packages/shared/src/constants/safety.constants.ts` (ingest re-filter), `apps/web/src/modules/game/*` (result components + `useShareResult.hook.ts`).
- Observability: pino JSON via `docker compose logs`; `AppError`/`messageKey` catalog in `apps/api/src/core`.
- Gap owners: both open gaps owned by Ihab (table above).

## Phase Blockers

Do not close this phase if:

- rollout or rollback is still fuzzy — clear: atomic release, revert-only rollback, stateless, redeploy clears the cache.
- observability is still undefined — defined: metadata-only structured logs, cache-size/eviction counters, messageKeys, existing inspection path.
- major readiness gaps have no owners — both gaps owned by Ihab with resolution phases.
- the team would still be improvising once coding starts — not the case: slices, schemas, config vars, cache bounds, endpoints, page states, modal targets, tests, and docs scope are enumerated above.

No blocker applies. Phase 13 closed as **GO** on 2026-07-08 by Ihab.
