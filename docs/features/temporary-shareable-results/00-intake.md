# 00 - Request Intake and Classification

> Current implementation note (2026-07-10): memory remains the sole cache adapter, so the unused
> `SHARE_RESULT_CACHE_DRIVER` setting was removed. Add driver selection only with a tested second
> adapter; historical planning references below remain decision history.

## Purpose

Classify the `temporary-shareable-results` request — let a player share their Twinzy final result through a **temporary public page** opened by a UUID URL, with **no database**, that auto-expires (default 10 minutes, configurable), shows a live countdown, and offers many share targets — before any solutioning begins.

## Step-by-Step Workflow

1. Request ID assigned: `TWZ-SHARE-001`.
2. Source recorded: owner-directed product request (Ihab, 2026-07-08); sponsoring party is the repository owner.
3. Request type classified: production feature — new backend module (`share-results`) with a temporary in-memory TTL cache behind a port, three versioned `/api/v1` endpoints, a new public frontend route + share modal, shared Zod contracts, plus security/privacy, config, test, and documentation work.
4. Affected domains identified: see Affected Domains below — all three workspaces (`apps/api`, `apps/web`, `packages/shared`) plus config, security/privacy, and documentation layers. The AI pipeline is **not** touched.
5. Severity assessed as major (new externally reachable surface that serves user results publicly); urgency normal; standard track (no incident, no hotfix pressure).
6. Critical-risk areas flagged: a **public-by-link** surface that serves result content to anyone holding the URL until expiry; the caching of result payloads in server memory (must never grow unbounded, must never hold image bytes); re-running the safety filter and rejecting any image/base64/`data:` string on ingest; UUID validation and rate limiting on both create and read.
7. Owners assigned: Ihab is intake, business, and technical owner (solo product + engineering).
8. Invariant check at intake: PASSED — the request adds **no** payments, **no** auth, **no** accounts, **no** database, **no** biometrics, and **no** image persistence. Only the already-validated, safety-filtered `FinalGameResult` JSON (plus `shareId`/`createdAt`/`expiresAt`/`languageCode`) is cached, in memory, with a hard TTL. Nothing to reject.

## Request Record

| Field | Value |
| --- | --- |
| Request ID | `TWZ-SHARE-001` |
| Feature slug | `temporary-shareable-results` |
| Request title | Temporary shareable results: expiring UUID share page (no DB) + multi-platform share modal |
| Request type | feature (new module + endpoints + public route + shared contracts + config) |
| Request source | roadmap (owner request) |
| Requested by | Ihab (repository/product owner) |
| Intake owner | Ihab |
| Business owner | Ihab |
| Technical owner | Ihab |
| Requested date | 2026-07-08 |
| Target timeline | current delivery stream; phased slices with all gates green per slice |

## Affected Domains

- [x] Frontend (`apps/web`) — new public route `app/share/[shareId]/page.tsx` (loading / active / expired / not-found states, live 1-second countdown from server `expiresAt`); a share modal on the existing result screen (Web Share API first, fallback copy-link + WhatsApp/Telegram/Facebook/X/LinkedIn/Email/Reddit); the share create + modal + public-page container live **inside** the existing `modules/game` module to reuse result components and avoid a circular module dependency
- [x] Backend (`apps/api`) — new `modules/share-results` (api/application/infrastructure/model/lib/tests): `POST /api/v1/share-results`, `GET /api/v1/share-results/:shareId`, optional `DELETE /api/v1/share-results/:shareId`; `ShareResultCachePort` + DI token with a bounded in-memory TTL adapter
- [x] Shared contracts (`packages/shared`) — share create request/response schemas, share read response schema, `shareId` (UUID) schema; reuse of the existing `FinalGameResultSchema` as the create payload contract
- [x] Config (`apps/api/src/config`) — five new zod-validated env vars (`SHARE_RESULT_TTL_SECONDS`, `SHARE_RESULT_CACHE_DRIVER`, `SHARE_RESULT_MAX_PAYLOAD_BYTES`, `SHARE_RESULT_MAX_ACTIVE_ITEMS`, `SHARE_RESULT_PUBLIC_BASE_URL`) with bounds constants and typed accessors; `.env.example` update
- [x] Security / privacy — public-by-link exposure, ingest safety re-filtering, image/base64/`data:` rejection, UUID validation, rate limiting on create + read, no raw-payload/stack-trace/provider-error logging, output escaping on the public page
- [ ] AI / model behavior (prompts, safety filtering, Gemini adapter) — Not touched; the pipeline is unchanged. The shared safety constants are **reused** to re-filter on ingest, but no prompt, adapter, or model behavior changes
- [ ] Integrations — no new external integration; share targets are plain URL-encoded deep links, not SDKs
- [ ] Support / player operations — no dedicated support workflow exists (free anonymous game, no accounts); player-visible behavior is covered by docs and release notes
- [ ] Legal / compliance — no new data categories, no persistence beyond a short in-memory TTL, no biometrics; privacy posture is analyzed and preserved (accepted by Ihab)
- [x] Documentation (rules, memory, runbooks, release notes) — README "How it works"/share behavior, architecture map (new module + the cache port), privacy doc (temporary in-memory retention + public-by-link risk), env-vars doc, `memory/` decision on the cache-port + Redis-later choice

## Criticality and Delivery Track

| Item | Answer |
| --- | --- |
| Severity | major — a new externally reachable surface that serves result content publicly and caches payloads in server memory |
| Urgency | normal — roadmap work, no incident or deadline pressure |
| Standard or hotfix track | standard |
| Player-facing | yes — a new public share page, a live countdown, and a multi-platform share modal on the result screen |
| Consent or upload-chain impact | no — the upload/consent/analyze chain is untouched; only the already-produced `FinalGameResult` is shared, and the image is never involved |
| AI behavior or prompt impact | no — prompts, adapter, and pipeline unchanged; safety constants are reused read-only on ingest |
| Privacy or regulated data impact | yes (reviewed) — result content is exposed to anyone with the link until expiry; payloads live in server memory under a hard TTL and byte/item caps; **no image bytes/url/hash/metadata/embeddings** are ever accepted or stored |
| External integration impact | no — share targets are static URL-encoded web intents, no third-party SDK or API |
| Production incident related | no |

## Initial Scope Summary

### Problem statement

Twinzy players get a rich, playful visual-similarity result but currently have no good way to show it to a friend — the only share affordance is a clipboard copy of safe text (`useShareResult.hook.ts`). This request adds a **temporary, self-expiring, database-free** way to share the actual result view: the result screen mints a share link (`POST /api/v1/share-results`) carrying the existing validated `FinalGameResult`; the server re-validates and re-safety-filters it, rejects anything image-like, stores it under a crypto-random UUID in a bounded in-memory TTL cache, and returns a public URL plus timing metadata. Opening `/share/{uuid}` fetches the record (`GET /api/v1/share-results/:shareId`) and renders the full result (results, scores, reasons, compact + optional detailed traits, uncertainty, disclaimer) with a **live countdown**; once the TTL elapses the record is gone and the page shows an expired state. A share modal offers Web Share API plus URL-encoded deep links to many platforms. **No database, no accounts, no image, no payments** — the cache is memory-only now, with Redis/Valkey documented as the drop-in production adapter behind the same port.

### Systems likely impacted

- `apps/api`: new `modules/share-results` (thin controller with one delegation per endpoint; create/read/delete use-cases; a focused validation+safety service; `ShareResultCachePort` DI token; a bounded in-memory TTL cache adapter in `infrastructure`; pure `lib` helpers for share-id generation, expiry math, and share-url building); `config` (five new env vars + bounds + accessors); module registration in the app; throttler config for the two hot routes
- `apps/web`: new `app/share/[shareId]/page.tsx` route (imports its container from `@/modules/game`); a public share-result container + countdown hook + share modal + share-target helpers inside `modules/game`; extension of the existing result screen's "Share result" affordance to create a link and open the modal; i18n strings (en/ar); `noindex/nofollow` + generic safe Open Graph metadata
- `packages/shared`: share create/read request+response schemas, `shareId` UUID schema, derived types; the existing `FinalGameResultSchema` reused as the create-payload contract
- Test suites at every layer: shared schema tests; backend unit (cache TTL/eviction/caps, expiry helpers, safety/image rejection, url building) + integration (create→read→expire, 404 on unknown/expired, 429 on abuse, payload-too-large, image rejected); frontend unit/component (countdown, states, modal, share-target encoding, no image rendered) + e2e (create link → open in a fresh browser context → countdown → expired); architecture/lint tests (no DB, no image persistence, no raw cache client outside the adapter, no TS `enum`, no `any`, no inline definitions, thin controller)
- Documentation: README, architecture map, privacy/data-retention, env-vars, memory logs, this feature's SDLC artifacts, release notes

### Known dependencies

- The existing `FinalGameResultSchema` in `packages/shared/src/schemas/game-result.schema.ts` (the exact shared contract the create endpoint validates) and the shared safety constants in `packages/shared/src/constants/safety.constants.ts` (reused to re-filter on ingest)
- The typed, zod-validated, fail-fast config layer (`apps/api/src/config` — `env.schema.ts`, `env-bounds.constants.ts`, `app-config.service.ts`) — the only place `process.env` is read
- The existing `@nestjs/throttler` per-route pattern (`ANALYZE_THROTTLE`/`TRANSLATE_THROTTLE` `as const` objects) reused for the new routes
- The existing error envelope (`AppError` + `messageKey`) and the frontend i18n/RTL/theme infrastructure
- No external service, no Redis instance today (Redis is the documented future adapter, not a launch dependency), no upstream teams, vendors, or contracts — solo-owner project

### Intake assumptions

- **Memory-only cache for launch.** A single bounded in-memory TTL adapter ships now. Redis/Valkey is the documented production extension of the same `ShareResultCachePort`; it is deliberately **not** built now to avoid shipping untested/dead infra (the repo has no Redis today). Risk: in a multi-replica deployment a link created on one instance is not readable on another, and a restart/deploy drops live links early — documented as a known limitation, acceptable for the current single-instance deployment.
- **The create endpoint accepts the full `FinalGameResult`, not a slim payload.** Reusing the existing strict, already-safety-checked contract avoids a parallel schema and guarantees the shared view matches the result view. Risk: a larger request body — bounded by `SHARE_RESULT_MAX_PAYLOAD_BYTES` and the strict schema.
- **Public-by-link is intended and accepted.** Anyone with the UUID URL can view the result until it expires; there is no auth by product invariant. The UUID is unguessable, the TTL is short, `noindex/nofollow` prevents indexing, and nothing identifies the user. Risk accepted and documented.
- **The share container lives inside `modules/game`.** Placing the create/modal/public-page code in the existing game module (rather than a new `modules/share` that would import game result components) avoids a circular frontend module dependency and reuses the result components directly. The route file only imports the container from `@/modules/game`.
- **TTL default 600s (10 min), bounded 60–3600s.** Chosen as a friendly "show a friend now" window; configurable via `SHARE_RESULT_TTL_SECONDS`.

## Exit Checklist

- [x] Request ID assigned (`TWZ-SHARE-001`)
- [x] Type classified (feature: new module + endpoints + public route + shared contracts + config; not AI/prompt work)
- [x] Domains identified (api, web, shared, config, security/privacy, docs)
- [x] Severity and urgency recorded (major / normal)
- [x] Owners assigned (Ihab: intake, business, technical)
- [x] Delivery track chosen (standard)
- [x] Criticality flags documented (public-by-link exposure, in-memory payload caching, ingest safety re-filtering, image rejection, UUID + rate limiting)

## Sign-Off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Intake owner | Ihab | approve | 2026-07-08 |

## Evidence And References To Attach

- Product invariants: root `CLAUDE.md` "Twinzy Product Constraints" (free, no DB, no accounts, no auth, no payments, no image persistence, visual-similarity pivot); `rules/00-non-negotiable-rules.md`; `rules/14-ai-safety.md`; `rules/15-file-upload-security.md`
- Reused contracts: `packages/shared/src/schemas/game-result.schema.ts` (`FinalGameResultSchema`), `packages/shared/src/constants/safety.constants.ts` (forbidden phrases/topics)
- Config canon: `apps/api/src/config/env.schema.ts`, `env-bounds.constants.ts`, `app-config.service.ts`
- Throttle pattern: `apps/api/src/modules/game/model/game.constants.ts` (`ANALYZE_THROTTLE`, `TRANSLATE_THROTTLE`)
- Prior related work: `docs/features/advanced-global-traits-v2/` (TWZ-V2-001 — produced the `FinalGameResult` this feature shares)
- Rollback reference: revert the feature commits; the app is stateless with no DB, so rollback is a pure code revert (a redeploy also clears the in-memory cache)
- Escalation contact: Ihab (sole owner)

## Phase Blockers

None open. Reviewed against the blocker list:

- Request type is unambiguous (owner-authored request with an explicit shape: temporary share, no DB, UUID URL, countdown, multi-platform share).
- Ownership is unambiguous (solo owner: Ihab).
- Severity/urgency are recorded above, not guessed.
- Critical-risk areas were reviewed: public-by-link exposure, in-memory caching bounds, ingest safety re-filtering and image rejection, UUID validation, and rate limiting — all carried forward to the impact, standards, test, and security phases.
- Stable identifier exists: `TWZ-SHARE-001` / `temporary-shareable-results`.
