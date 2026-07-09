# 06 - Technical Refinement

- Request ID: TWZ-SHARE-001
- Feature: temporary-shareable-results
- Date: 2026-07-08
- Owner: Ihab (product + engineering)
- Track: standard (new public surface + in-memory payload caching; no AI-pipeline change)

## Purpose

Select the technical direction for temporary, database-free result sharing — a UUID-addressed share link with a live countdown and a multi-platform share modal — after comparing realistic implementation options and trade-offs.

## Step-by-Step Workflow

1. Candidate approaches defined for the load-bearing decisions: (a) where the shared result lives (no-DB storage), (b) create-payload contract shape, (c) frontend module placement, (d) share-target mechanism.
2. Each approach evaluated for complexity, security, scalability, cost, latency, reliability, maintainability, and backward compatibility (matrix below).
3. Chosen approach recorded with reasoning; cross-checked against repo canon (`context/architecture-map.md`, `rules/00-non-negotiable-rules.md`, `rules/14-ai-safety.md`, `rules/16-backend-architecture.md`).
4. Rejected approaches and open technical questions recorded with owners.

## Technical Context

Current landscape (read before refinement):

- Backend `apps/api`: NestJS 11 + Fastify, **no DB by design**, stateless. Modules follow a strict one-way layered anatomy (thin controller → use-case/service → domain → infrastructure/adapters). Every external library is wrapped behind an adapter; only `apps/api/src/config` reads `process.env` (zod-validated, fail-fast — `env.schema.ts`, `env-bounds.constants.ts`, `app-config.service.ts`). Per-route rate limits are `@nestjs/throttler` `as const` objects (e.g. `ANALYZE_THROTTLE`, `TRANSLATE_THROTTLE` in `game.constants.ts`). Errors are `AppError` + `messageKey`; no provider internals leak.
- Shared `packages/shared`: Zod `strict()` schemas + `as const` value objects (no TS `enum`) are the single cross-side source of truth. `FinalGameResultSchema` (`schemas/game-result.schema.ts`) is the exact result contract; safety constants live in `constants/safety.constants.ts` (visual-similarity pivot: graded resemblance allowed; identity-assertion and clinical-biometric wording banned).
- Frontend `apps/web`: App Router routes directly under `src/app` (no locale segment; next-intl en/ar). The game feature is `modules/game` in Component → Hook → Service → Gateway anatomy, with existing result components and an existing `useShareResult` clipboard hook + `share-button` component. HTTP goes only through gateway/`packages/axios`. Every user-facing string via i18n; RTL + dark/light + mobile-first.
- Invariants that constrain every option: free game; no payments/accounts/auth/DB; **no image bytes/url/hash/metadata/embeddings anywhere**; no identity/biometric/exact-lookalike wording; only the already-validated, safety-filtered `FinalGameResult` may be shared; `GEMINI_MODEL` and all caps env-driven; no TS `enum`; no inline definitions; gates lint 0/0, tsgo typecheck, coverage 95/90/95/95 on touched modules, knip, madge, trivy.

## Alternatives Considered

| Option | Description | Pros | Cons |
| --- | --- | --- | --- |
| A (chosen) | Backend `ShareResultCachePort` (interface + DI token) with a **bounded in-memory TTL adapter** now (lazy expiry on read + periodic sweeper + `OnModuleDestroy` cleanup + max-active-items + max-payload-bytes caps → reject creates at capacity). Three versioned endpoints under `/api/v1/share-results`: `POST` (validate full `FinalGameResult`, re-safety-filter, reject image/base64/`data:`, byte cap, mint `crypto.randomUUID`, compute `expiresAt`, store, return timing metadata + `shareUrl`), `GET /:shareId` (validate UUID, return active record or safe not-found/expired), optional `DELETE /:shareId`. Public route `app/share/[shareId]/page.tsx` imports a container from `modules/game`; live countdown from server `expiresAt`; share modal (Web Share API + copy-link + platform deep links). Redis/Valkey is the documented production extension of the same port. | No DB, no persistence, invariants intact; the port makes Redis a drop-in with zero call-site churn; memory is hard-bounded (no unbounded growth, no DoS); TTL enforced server-side so expired records are never returned; UUID-only URLs; reuses `FinalGameResult` + safety constants for guaranteed parity and safety; share code inside `modules/game` avoids a circular dependency. | A restart/deploy or multi-replica drops links early on the memory adapter (documented limitation); one more module + public surface + safety boundary to own; a larger create body (bounded by the byte cap). |
| B (rejected) | **Client-only share:** encode the full result (compressed/base64) into the share URL itself; the public page decodes and renders it — no server storage at all. | Truly stateless; no cache, no memory cost; no server read endpoint. | The full result content lives in the URL (leaks in history, referrers, chat previews); no real expiry/countdown guarantee (the URL works forever); huge, ugly URLs; no server-side safety re-check at read; no clean scale path; contradicts "temporary/self-deleting" promise. |
| C (rejected) | **Persist shares in a datastore** (SQLite/Postgres/Redis-as-primary) with rows and a TTL/cron cleanup. | Durable across restarts; multi-instance out of the box; familiar CRUD. | Violates the no-DB / no-persistence invariant; adds infra, migrations, backups, and a retention surface the product explicitly forbids; over-built for minutes-long ephemeral links; heavier privacy posture (data at rest). |

## Trade-Off Analysis

| Dimension | Option A | Option B | Option C | Selected reasoning |
| --- | --- | --- | --- | --- |
| Simplicity | One module + one adapter behind a port | Trivial server, but heavy client codec + URL handling | New datastore, migrations, cleanup jobs | A — complexity is contained in one owned adapter |
| Maintainability | Port isolates storage; swap adapters freely | Codec/versioning of URL payloads is brittle | DB schema + ops to maintain forever | A |
| Scalability | Memory now; Redis behind the same port later | No server state, but no real product either | Scales, but forbidden by invariants | A — scale path preserved without paying now |
| Performance | Bounded in-memory lookup (sub-ms) | Large URL + client decode cost | DB round-trips per read | A |
| Security | Crypto UUID, TTL, caps, image rejection, safe OG, redacted logs | Full content in URL leaks; no server re-check | Data at rest expands the attack/retention surface | A |
| Cost | Small bounded memory only | Zero server cost, high UX/privacy cost | Infra + ops cost | A |
| Reliability | TTL/sweeper reclaim; capacity rejection is safe | URL always works (no expiry) — a reliability *anti*-goal here | Durable but over-engineered | A — ephemerality is a product requirement, not a bug |
| Backward compatibility | Additive endpoints + additive shared schemas; reuse `FinalGameResult` | New URL scheme, fragile | New infra + config surface | A |

## Chosen Approach

Option A, end to end:

1. **Shared contracts** (`packages/shared`): a `shareId` UUID schema; a create request that **reuses `FinalGameResultSchema`**; a create-response schema (`shareId`, `shareUrl`, `createdAt`, `expiresAt`, `ttlSeconds`); a read-response schema (`shareId`, `languageCode`, `result`, `createdAt`, `expiresAt`, `remainingSeconds`). All Zod `strict()`, derived types exported, no inline definitions, no `enum`.
2. **Config** (`apps/api/src/config`): `SHARE_RESULT_TTL_SECONDS` (default 600, min 60, max 3600), `SHARE_RESULT_CACHE_DRIVER` (`memory` — an `as const` union leaving room for `redis`), `SHARE_RESULT_MAX_PAYLOAD_BYTES` (default 50000), `SHARE_RESULT_MAX_ACTIVE_ITEMS` (default 1000), `SHARE_RESULT_PUBLIC_BASE_URL` (default `http://localhost:3000`). Bounds in `env-bounds.constants.ts`; typed accessors in `app-config.service.ts`; fail-fast on invalid; `.env.example` synced.
3. **Backend module** `apps/api/src/modules/share-results` (`api`/`application`/`infrastructure`/`model`/`lib`/`tests`): a thin controller with one delegation per endpoint; create/read/(delete) use-cases owning flow; a focused validation/safety service (schema re-parse is already guaranteed by the DTO, then re-run the forbidden-wording/sensitive-topic filter and **reject any image/base64/`data:` content**, then enforce the byte cap); `ShareResultCachePort` + DI token in `model`; a bounded in-memory TTL adapter in `infrastructure` (a private `Map<shareId, record>` — the only place the raw store lives — with lazy expiry on read, a periodic sweeper timer, `OnModuleDestroy` cleanup, and item/byte caps that reject creates at capacity); pure `lib` helpers for share-id (`crypto.randomUUID`), expiry math (`expiresAt`, `remainingSeconds`, `isExpired`), and share-url building from `SHARE_RESULT_PUBLIC_BASE_URL`. Two `@nestjs/throttler` `as const` route limits. All errors `AppError` + `messageKey`; logs metadata-only (never result content, never payloads, never image — none exists).
4. **Frontend** (`apps/web`): the public route `app/share/[shareId]/page.tsx` sets `noindex, nofollow` + a generic safe Open Graph card and imports a container from `@/modules/game`. Inside `modules/game`: a public share-result container (loading/active/expired/not-found), a 1-second countdown hook derived from server `expiresAt` (cleared on unmount; transitions to expired at zero without showing a stale result), a share modal (Web Share API first; fallback copy-link + URL-encoded deep links to WhatsApp/Telegram/Facebook/X/LinkedIn/Email/Reddit; UUID-only URL; localized share text; candidate names never translated), and share-target helpers. The existing result screen's "Share result" calls a create mutation and opens the modal. Reuses existing result components; never renders the image; no `dangerouslySetInnerHTML`; RTL/dark/mobile-first preserved.
5. **Operational model**: stateless, no migrations, no new infra. A restart/deploy clears the cache (documented). Rollback = revert the feature commits.

## Rejected Approaches and Why

- **Encode the result in the share URL (client-only):** leaks full content into URLs/history/previews, gives no real expiry, produces huge URLs, and skips a server-side safety re-check at read time.
- **Persist shares in a database/Redis-as-primary:** violates the no-DB/no-persistence invariant; adds infra, migrations, backups, and a data-at-rest retention surface the product forbids — over-built for minutes-long links.
- **Build the Redis/Valkey adapter now:** no Redis host exists in the repo; shipping it now would be untested/dead infra. It is documented as the production extension of `ShareResultCachePort` instead — swap-in later with zero call-site churn.
- **A slim custom share DTO instead of `FinalGameResult`:** would duplicate the result contract, risk drift from the result page, and lose the existing strict safety-checked validation; reusing `FinalGameResultSchema` is safer and guarantees parity (body size is bounded by the byte cap).
- **A separate `modules/share` on the frontend:** importing game's result components from a new module (and game importing the share modal) creates a circular dependency; placing share code inside `modules/game` avoids it and reuses components directly.
- **A global cache module / raw `Map` used directly by the use-cases:** would leak the storage mechanism across the layer boundary; the port + adapter keeps the raw client in one place and makes Redis a drop-in.
- **Rendering result specifics into Open Graph for rich previews:** would leak result content into link unfurls and indexers; the OG card stays generic and safe.

## Open Technical Questions

| Question | Owner | Due date | Resolution |
| --- | --- | --- | --- |
| Sweeper interval vs pure lazy-expiry — what cadence bounds memory without waste? | Ihab | 2026-07-10 | pending — start with lazy expiry on read + a periodic sweeper (interval derived from TTL/config); tune only if hypercare shows drift |
| Should the create response include `remainingSeconds` too, or only `expiresAt`/`ttlSeconds`? | Ihab | 2026-07-09 | pending — server `expiresAt` is the source of truth for the countdown; create returns `expiresAt` + `ttlSeconds`, read returns `remainingSeconds`; revisit if the client needs it earlier |
| Can Playwright e2e (open link in a fresh browser context, watch the countdown, hit expiry) run in this Windows CI/browser environment? | Ihab | 2026-07-11 | pending — record the exact blocker in `15-dev-validation-report.md` if the environment prevents execution; use fake-clock component tests as the deterministic substitute |

## Technical Debt Impact

- Debt reduced: sharing moves from an ad hoc clipboard copy to a first-class, contract-backed capability; the storage seam is abstracted behind a port from day one (no future refactor to introduce Redis); all timing/caps are config-driven, not hardcoded.
- Debt introduced: one more externally reachable surface and safety boundary to maintain; a memory adapter whose multi-instance/restart limitation must be remembered (documented in privacy + memory logs); the share code lives inside `modules/game`, keeping that module a little larger.
- Follow-up required: implement the Redis/Valkey adapter behind `ShareResultCachePort` when the deployment goes multi-instance (schema + adapter + `SHARE_RESULT_CACHE_DRIVER=redis`, no call-site changes); revisit sweeper cadence and caps against real hypercare metrics.

## Exit Checklist

- [x] Alternatives documented (three composite options + six rejected variants)
- [x] Trade-offs analyzed (eight-dimension matrix)
- [x] Chosen approach justified (per-dimension reasoning + invariant mapping)
- [x] Rejected approaches recorded
- [x] Open technical questions assigned (all owned by Ihab with due dates)

## Sign-Off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Technical owner | Ihab | approve | 2026-07-08 |
| Architect if applicable | Ihab (single-owner project; architecture hat) | approve | 2026-07-08 |

## Evidence And References To Attach

- Existing patterns reused: `apps/api/src/config/env.schema.ts` + `env-bounds.constants.ts` + `app-config.service.ts` (typed config), `apps/api/src/modules/game/model/game.constants.ts` (`ANALYZE_THROTTLE`/`TRANSLATE_THROTTLE`), `packages/shared/src/schemas/game-result.schema.ts` (`FinalGameResultSchema`), `packages/shared/src/constants/safety.constants.ts`
- Repo canon consulted: `context/architecture-map.md`, `rules/00-non-negotiable-rules.md`, `rules/14-ai-safety.md`, `rules/16-backend-architecture.md`, `rules/12-i18n.md`, `rules/13-accessibility.md`
- Sibling artifacts: `docs/features/temporary-shareable-results/08-architecture-review.md` (boundary/ADR), `11-test-strategy.md` (test mapping)
- ADRs: a new ADR is warranted for the cache-port + memory-now/Redis-later decision (recorded in phase 08); no new architectural style is introduced (existing layered pattern extended)

## Phase Blockers

Do not close this phase if:

- only one option was considered when multiple realistic options exist — **not the case**: three composite options and six rejected variants evaluated above
- trade-offs are hidden behind preferences — **not the case**: eight-dimension matrix recorded
- the chosen approach has no explicit reasoning — **not the case**: reasoning per dimension plus invariant mapping recorded
- open technical questions remain ownerless — **not the case**: all three assigned to Ihab with due dates

No blockers remain; phase 06 is closed as of 2026-07-08.
