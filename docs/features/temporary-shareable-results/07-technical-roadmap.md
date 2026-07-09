# 07 - Technical Roadmap

- Request ID: TWZ-SHARE-001
- Feature: temporary-shareable-results
- Date: 2026-07-08
- Owner / approver: Ihab (product + engineering)
- Track: standard (new public surface + in-memory payload caching; no AI-pipeline change)

## Purpose

Define the engineering execution phases for temporary, no-DB result sharing — a `ShareResultCachePort` with a bounded in-memory TTL adapter, three `/api/v1/share-results` endpoints, a public `/share/{uuid}` page with a live countdown, and a multi-platform share modal — sequenced into safe, reviewable slices that keep every gate green and every product invariant intact.

## Step-by-Step Workflow

1. Break the feature into 6 milestones, ordered so shared contracts and config land additively before any consumer behavior changes.
2. Follow repo convention: conventional commits per slice on `main`, Husky pre-commit/pre-push gates on every commit (lint 0/0, typecheck, tests, coverage on touched modules).
3. Evolve contracts in `packages/shared` first (Zod `strict()`, `as const` — no TS `enum`); the `/api/v1` envelope stays unchanged; the new routes are additive. There is no database schema in this repository.
4. Roll out API + web together (single monorepo deploy, stateless product); roll back by reverting slice commits in reverse order.
5. Each slice is tests-first, independently reviewable, and independently revertable.

## Engineering Milestones

| Milestone | Description | Dependencies | Merge criteria |
| --- | --- | --- | --- |
| 1 — Shared contracts + config (additive) | `packages/shared`: `shareId` UUID schema; create request = reuse `FinalGameResultSchema`; create-response schema (`shareId`, `shareUrl`, `createdAt`, `expiresAt`, `ttlSeconds`); read-response schema (`shareId`, `languageCode`, `result`, `createdAt`, `expiresAt`, `remainingSeconds`); derived types. `apps/api/src/config`: five env vars (`SHARE_RESULT_TTL_SECONDS` 600/60–3600, `SHARE_RESULT_CACHE_DRIVER` `memory`, `SHARE_RESULT_MAX_PAYLOAD_BYTES` 50000, `SHARE_RESULT_MAX_ACTIVE_ITEMS` 1000, `SHARE_RESULT_PUBLIC_BASE_URL` `http://localhost:3000`) with bounds constants + typed accessors; `.env.example` updated. All Zod `strict()`, `as const`, no `enum`, no inline defs. No runtime behavior yet. | none | Schema + config unit tests first and green (including fail-fast on invalid env); lint 0/0; typecheck; existing api/web builds unaffected (purely additive) |
| 2 — Cache port + in-memory TTL adapter | `model`: `ShareResultCachePort` interface + DI token + the stored-record type. `infrastructure`: bounded in-memory TTL adapter — a private `Map` (only place the raw store lives), `create` (rejects at `SHARE_RESULT_MAX_ACTIVE_ITEMS` and at `SHARE_RESULT_MAX_PAYLOAD_BYTES`), `get` (lazy expiry — never returns an expired record), `delete` (idempotent), a periodic sweeper timer, and `OnModuleDestroy` cleanup (clear map + clear timer). `lib`: pure expiry helpers (`computeExpiresAt`, `remainingSeconds`, `isExpired`) and the share-id generator (`crypto.randomUUID`). | 1 | Adapter unit tests green: TTL lazy expiry + sweeper reclamation, `OnModuleDestroy` clears map/timer, item-cap + byte-cap rejection, delete idempotency; coverage ≥95/90/95/95; raw `Map` only inside the adapter (architecture test) |
| 3 — Backend endpoints | `api`: thin `share-results.controller.ts` (one delegation per endpoint) — `POST /api/v1/share-results`, `GET /api/v1/share-results/:shareId`, optional `DELETE /api/v1/share-results/:shareId`; DTOs. `application`: create use-case (validate `FinalGameResult` → re-run safety filter → reject any image/base64/`data:` string → enforce byte cap → mint UUID → compute `expiresAt` → store via port → build `shareUrl` → return timing metadata), read use-case (validate UUID → active record or safe not-found/expired via `messageKey`), delete use-case (idempotent). Throttler: `SHARE_CREATE_THROTTLE` + `SHARE_READ_THROTTLE` `as const`. Module registration. | 1, 2 | Integration tests green: create→read happy path; create→wait→read = not-found; unknown/malformed UUID = safe error; image/base64/oversized rejected; capacity rejection; 429 on abuse; delete idempotent; controller stays thin; `AppError`/`messageKey` only; logs metadata-only |
| 4 — Frontend page + countdown | `app/share/[shareId]/page.tsx` (`noindex, nofollow` metadata + generic safe Open Graph; imports the container from `@/modules/game`). Inside `modules/game`: public share-result container (loading/active/expired/not-found), a gateway call to `GET /share-results/:shareId`, a 1-second countdown hook from server `expiresAt` (cleared on unmount; expired transition at zero without a stale result), reuse of existing result components (result cards, compact chips, detailed-traits accordion, uncertainty, disclaimer), a "Create your own result" call-to-action on every state. Never renders the image; no `dangerouslySetInnerHTML`; en/ar strings; RTL/dark/mobile-first. | 1, 3 | Component tests green: countdown ticking/zero/cleanup, all four states, no image rendered, escaping verified; a11y checks; lint 0/0; `noindex/nofollow` + safe OG asserted |
| 5 — Share modal + result-screen wiring | Inside `modules/game`: share modal (Web Share API first; fallback copy-link + URL-encoded deep links to WhatsApp/Telegram/Facebook/X/LinkedIn/Email/Reddit; UUID-only URL; localized share text; candidate names untranslated) and share-target helpers; a create-link mutation; wire the existing result screen's "Share result" to create a link and open the modal (extending/complementing the existing `useShareResult` clipboard path). | 3, 4 | Component tests green: each target's URL encoding, Web Share API path + fallback, copy-link, localized text, names untranslated, modal keyboard/focus/ARIA; lint 0/0; no forbidden wording in copy |
| 6 — E2E + docs + gate sweep | Playwright: create a link on the result screen → open it in a **fresh browser context** → see the full result + countdown → reach the expired state; not-found for a random UUID; 375px mobile; RTL; a11y smoke; `test:pwa`. Docs: README "How it works"/sharing, `docs/architecture.md` + `context/architecture-map.md` (new module + cache port), `docs/privacy-and-data-retention.md` (temporary in-memory retention, public-by-link risk, restart/multi-instance limitation, Redis-later path), `docs/env-vars.md` (five new vars), `memory/` decision. Full gate run: `npm run validate`, `test:coverage`, `test:pwa`, `quality:dead-code` (knip), `quality:circular` (madge), `security:scan` (trivy). | 2, 3, 4, 5 | All commands green or a documented environment blocker (e2e/browser); docs shipped in the same stream |

## Branch / Merge Strategy

Repo convention (single-owner repo): work lands on `main` as one conventional commit per milestone slice, e.g. `feat(shared): share-result contracts + config`, `feat(api): share-result cache port + in-memory adapter`, `feat(api): share-result endpoints`, `feat(web): public share page + countdown`, `feat(web): share modal + result-screen wiring`. Husky pre-commit/pre-push hooks run the authoritative gates on every commit; no `--no-verify`, no inline ESLint suppression, ever. Reviewability is preserved by slice size (each milestone is a self-contained, independently green commit) and tests-first ordering within each slice. WIP/debug commits never land on `main`.

## Contract Evolution Plan

All contract truth lives in `packages/shared` (Zod `strict()` objects + `as const` constants). The `/api/v1` response envelope is unchanged; the three `share-results` routes are **additive**. The create request **reuses `FinalGameResultSchema`** unchanged. There are no DB migrations in this repository (stateless, no persistence).

1. Additive: new share schemas + config land in `packages/shared` / `config` with no consumer switched (Milestone 1). Nothing existing changes shape.
2. Additive backend: the cache port/adapter (Milestone 2) and the three new routes (Milestone 3) add surface without touching any existing route or contract.
3. Frontend adopts the new read contract for the public page (Milestone 4) and the create contract for the modal (Milestone 5). API and web ship from the same commit train, so no cross-version client window exists.
4. Sunset: none — nothing is replaced. The existing `useShareResult` clipboard path is complemented, not removed (retire only if it becomes redundant, in a later slice).

## Rollout Sequence

1. Local: full gate suite green (`npm run validate`, `test:coverage`, `test:pwa`, knip, madge, trivy) on the final slice; `.env` has the five vars (defaults are safe).
2. Docker smoke (where configured): rebuild + up; create a share, open `/share/{uuid}`, watch the countdown, confirm the expired state after TTL; verify logs contain metadata only (no result content, no payloads, no image).
3. Production: deploy API + web together (single monorepo release) with `SHARE_RESULT_PUBLIC_BASE_URL` set to the real host. The product is stateless and anonymous; there is no cache to warm and no data to migrate.
4. Post-deploy smoke: create a link, open it in a fresh context, confirm results/countdown/disclaimer render, the image is never shown, an unknown UUID is safe not-found, and the create/read rate limits respond.

## Rollback Sequence

1. Triggers: any forbidden wording or image content reaching a shared page; a shared record surviving past its TTL; unbounded cache growth or a memory leak; a public-page rendering flaw; any gate found red post-hoc.
2. Rollback step: `git revert` the slice commits in reverse milestone order (6 → 1, or only the offending slice if later slices don't depend on it) and redeploy API + web together. No data migrations exist; a redeploy also clears the in-memory cache, so no records survive the rollback.
3. Validation after rollback: the result screen still works with the pre-feature clipboard share; the `share-results` routes are gone (404) or reverted; gates green on the reverted tree; logs clean.

## Feature Flag and Compatibility Notes

No feature flag is used — accepted by Ihab. Rationale: the endpoints and page are new and additive (nothing to gate off from), the app is stateless and single-audience (no tenants/accounts/gradual-rollout infra), and a flag would add a second code path on a security-relevant surface for no rollout benefit. Compatibility notes: all three routes and both shared schemas are additive; `SHARE_RESULT_CACHE_DRIVER` defaults to `memory` and is an `as const` union that will accept `redis` additively later; `SHARE_RESULT_PUBLIC_BASE_URL` only affects the host in minted links, never data safety. No dual-write or read-after-write concerns exist (no persistence). The Redis/Valkey adapter is the documented future extension of `ShareResultCachePort` and requires no contract change when introduced.

## Exit Checklist

- [x] Milestones defined (6 slices, tests-first, each independently green)
- [x] Merge strategy documented (conventional commit per slice on `main`, Husky gates, no bypass)
- [x] Contract evolution order defined (additive shared + config → additive port/adapter → additive routes → frontend adoption)
- [x] Rollout order defined (local gates → docker smoke → atomic API+web deploy → post-deploy smoke)
- [x] Rollback order defined (revert slices in reverse, redeploy clears cache, verify pre-feature behavior; no migrations)

## Evidence And References To Attach

- Sibling artifacts: `docs/features/temporary-shareable-results/00-intake.md` through `06-technical-refinement.md` (TWZ-SHARE-001)
- Config + throttle anchors: `apps/api/src/config/env.schema.ts`, `env-bounds.constants.ts`, `app-config.service.ts`; `apps/api/src/modules/game/model/game.constants.ts`
- Reused contract + safety anchors: `packages/shared/src/schemas/game-result.schema.ts`, `packages/shared/src/constants/safety.constants.ts`
- Frontend anchors: `apps/web/src/app/` (route root), `apps/web/src/modules/game/` (existing result components + `useShareResult.hook.ts`)
- Gate commands: `npm run validate`, `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`, `npm run test:coverage`, `npm run test:pwa`, `npm run quality:dead-code`, `npm run quality:circular`, `npm run security:scan`

## Phase Blockers

Do not close this phase if:

- implementation slices are too large to review safely — mitigated: 6 bounded slices; the largest (Milestones 4/5) is confined to `apps/web` game feature + one route file
- contract evolution order is still unclear — resolved: additive-first (shared + config), then additive port/adapter, then additive routes, then frontend adoption
- rollback order is missing for risky changes — resolved: commit-revert per slice, no migrations, redeploy clears the cache
- the roadmap cannot be followed step by step — resolved: each milestone lists dependencies and merge criteria; no slice starts before its dependencies are merged green

Status: no open blockers. Phase 07 closed by Ihab, 2026-07-08.
