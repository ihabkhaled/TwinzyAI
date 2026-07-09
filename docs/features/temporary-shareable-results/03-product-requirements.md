# 03 - Product Requirements

- **Request ID:** TWZ-SHARE-001
- **Feature:** temporary-shareable-results
- **Date:** 2026-07-08
- **Owner / approver:** Ihab (product + engineering)
- **Source:** owner product request (2026-07-08)

## Purpose

Translate the business intent — a temporary, database-free, self-expiring way to share a Twinzy result via a UUID URL, with a live countdown and multi-platform sharing — into testable product requirements.

## Step-by-Step Workflow

Executed for this request: epics and stories defined below, acceptance criteria written in observable terms, scope boundaries and non-goals fixed, UX/permission/localization/error-state expectations documented, product definition of done recorded.

## Epics

| Epic ID | Epic title | Outcome |
| --- | --- | --- |
| E1 | Create share link | `POST /api/v1/share-results` validates a full `FinalGameResult`, re-runs the safety filter, rejects any image/base64/`data:` content, enforces a payload byte cap, mints a crypto-random UUID, computes `expiresAt`, stores it in a bounded in-memory TTL cache, and returns `{ shareId, shareUrl, createdAt, expiresAt, ttlSeconds }` |
| E2 | Read share link | `GET /api/v1/share-results/:shareId` validates the UUID and returns the active `{ shareId, languageCode, result, createdAt, expiresAt, remainingSeconds }`, or a safe not-found/expired error via `messageKey`; expired records are never returned |
| E3 | Temporary cache (no DB) | A `ShareResultCachePort` (+ DI token) with a bounded in-memory TTL adapter: lazy expiry on read, periodic sweeper, `OnModuleDestroy` cleanup, max-active-items and max-payload-bytes caps (reject new creates at capacity). Redis/Valkey documented as the production extension of the same port |
| E4 | Public share page | `/share/{uuid}` fetches by UUID and renders loading / active / expired / not-found states; a live 1-second countdown from server `expiresAt`; all result content; never the image; `noindex/nofollow` + generic safe Open Graph |
| E5 | Share modal on result screen | "Share result" creates a temporary link and opens a modal: Web Share API first, fallback copy-link + WhatsApp/Telegram/Facebook/X/LinkedIn/Email/Reddit, all URL-encoded, UUID-only URL, localized share text, candidate names never translated |
| E6 | Optional delete | `DELETE /api/v1/share-results/:shareId` removes a record early (best-effort, idempotent) |

## User Stories

| Story ID | As a | I want | So that |
| --- | --- | --- | --- |
| S1 | player who finished a result | to tap "Share result" and get a link | I can send my result to a friend |
| S2 | player | to share via my OS share sheet or a specific app (WhatsApp, Telegram, etc.) | I can share where I already talk to people |
| S3 | link recipient | to open the link and see the full result | I can see what my friend saw |
| S4 | recipient | to see how long the link lasts and be invited to try the game | I understand it is temporary and can make my own |
| S5 | privacy-conscious player | the link to be unguessable, image-free, identity-free, and to expire on its own | I can share without anything being stored about me |
| S6 | operator (Ihab) | the shared payload re-validated and re-safety-filtered, and the cache bounded | unsafe content and unbounded memory growth are impossible |
| S7 | keyboard / screen-reader user | the share modal and share page fully operable and announced | the feature does not exclude me |

## Acceptance Criteria

| Story ID | Acceptance criterion | Priority |
| --- | --- | --- |
| S1 | "Share result" on the result screen calls `POST /api/v1/share-results` with the current validated `FinalGameResult`; on success a modal opens showing the share URL; the URL contains only the UUID (`{SHARE_RESULT_PUBLIC_BASE_URL}/share/{uuid}`) | Must |
| S1 | The create endpoint validates the body against `FinalGameResultSchema`, re-runs the forbidden-wording/sensitive-topic safety filter, and **rejects** any field containing image-like content (`data:`, base64 image, or an image URL) with a `messageKey` error; oversized bodies (> `SHARE_RESULT_MAX_PAYLOAD_BYTES`) are rejected | Must |
| S3 | `GET /api/v1/share-results/:shareId` with a valid, active UUID returns `{ shareId, languageCode, result, createdAt, expiresAt, remainingSeconds }`; the public page renders all result cards (name, score, confidence, verdict, country/region, category, reason, matching/weak/mismatch traits), the compact trait summary, an optional detailed-traits accordion, the uncertainty content, and the server disclaimer | Must |
| S3 | The public page **never** renders the uploaded image or any image field; there is no image in the response, cache, or page | Must |
| S4 | The public page shows a live countdown that updates every second from server `expiresAt`; when it reaches zero the page switches to the expired state without showing a stale result; the timer is cleaned up on unmount | Must |
| S3/S4 | An unknown UUID, an expired record, or a malformed UUID renders a safe not-found / expired state (no stack trace, no provider error); a "Create your own result" action is present on active, expired, and not-found states | Must |
| S2 | The modal offers Web Share API when available; otherwise a copy-link button plus URL-encoded deep links to WhatsApp, Telegram, Facebook, X, LinkedIn, Email, and Reddit; the share text is localized; public-figure candidate names are never translated | Must |
| S5 | `shareId` is a crypto-random UUID (`crypto.randomUUID()`); the page is served with `noindex, nofollow` and a generic safe Open Graph card (no result specifics, no image); nothing in the payload identifies the user | Must |
| S6 | The in-memory cache enforces TTL (lazy expiry on read + sweeper + `OnModuleDestroy` cleanup) and hard caps (`SHARE_RESULT_MAX_ACTIVE_ITEMS`, `SHARE_RESULT_MAX_PAYLOAD_BYTES`); at capacity, new creates are rejected with a safe error; memory never grows unbounded | Must |
| S6 | Both create and read routes are rate-limited; no stack traces, provider errors, or raw payloads are logged; all errors are `AppError` + `messageKey` | Must |
| S7 | The share modal and share page are keyboard-operable with correct focus management and ARIA; the countdown is announced accessibly; color is never the only status signal; RTL, dark/light, and mobile-first (320–414px) are preserved | Must |
| S6 | Optional `DELETE /api/v1/share-results/:shareId` removes an active record and is idempotent (deleting an already-gone id is a safe no-op) | Should |

## Scope Boundaries

### In scope

- Three versioned endpoints (`POST` / `GET` / optional `DELETE`) under `/api/v1/share-results`
- `ShareResultCachePort` + DI token + bounded in-memory TTL adapter (no DB, no Redis built now)
- Shared Zod schemas for the create request/response and read response, and a `shareId` UUID schema; reuse of `FinalGameResultSchema` as the create payload
- Five zod-validated env vars with bounds + accessors; `.env.example` update
- Public route `app/share/[shareId]/page.tsx` + share-result container, countdown hook, share modal, and share-target helpers inside `modules/game`; extension of the result screen's "Share result"
- i18n (en/ar), RTL, dark/light, accessibility, `noindex/nofollow` + safe Open Graph
- Tests (shared schema, backend unit + integration, frontend unit + component, e2e, architecture) and docs in the same delivery stream

### Out of scope

- Any database, account, auth, or payment work (forbidden by invariants)
- A Redis/Valkey adapter (documented as the production path; not built now to avoid dead/untested infra)
- Persisting, listing, or editing shares; share history; analytics on shares
- Sharing or exposing the uploaded image in any form
- Server-side rendering of result specifics into Open Graph / link previews (the OG card stays generic and safe)
- Changes to the AI pipeline, prompts, adapter, upload/consent chain, or the `FinalGameResult` shape

## Non-Goals

- No permanent or long-lived shares — links are temporary and self-expiring by design
- No identity, exact-lookalike, face-recognition, or biometric claims — the public page is the same playful visual-similarity result, safety-filtered
- No monetization in any form — the game stays free
- No image in the share flow — nothing image-like is accepted, stored, returned, or rendered
- No unbounded memory — the cache is hard-capped and self-reclaiming

## UX Expectations

Sharer flow: on the result screen, "Share result" → creates a link (brief loading) → a modal opens with the share URL, a copy-link button, the OS share sheet (when available), and platform buttons; a localized "expires in N minutes" note sets expectations. Recipient flow: opening `/share/{uuid}` shows a loading state, then the active result — result cards, compact trait summary chips, an optional "Detailed traits" accordion, the uncertainty section, the disclaimer, a live countdown, and a prominent "Create your own result" call-to-action. When the countdown hits zero or the record is gone/unknown, the page shows a friendly expired/not-found state that keeps the "Create your own result" invite. Accessibility: keyboard-operable modal and accordion with focus management and ARIA; the countdown announced without spamming a screen reader; visible focus; no color-only status; reduced motion respected. Layout: mobile-first 320–414px through desktop, no horizontal scroll, RTL logical spacing, dark/light mode.

## Error States

- Create with invalid body / wrong `promptVersion` / forbidden wording / image or base64 / `data:` content / oversized payload: rejected via `ApiErrorResponse` + `messageKey` with friendly i18n copy; nothing is stored.
- Create at cache capacity (`SHARE_RESULT_MAX_ACTIVE_ITEMS` reached): safe "try again later" `messageKey` error (no server error, no leak).
- Read with malformed UUID: safe validation `messageKey`; treated as not-found on the page.
- Read with unknown or expired UUID: safe not-found/expired `messageKey`; the page shows the expired/not-found state — never a stale result.
- Countdown reaches zero client-side: the page transitions to expired without rendering the (now-deleted) result; re-fetch confirms not-found.
- Rate limit exceeded on create or read: `429` via the envelope with localized copy.
- Delete of an unknown/expired id: idempotent no-op success.
- Network/API failure on the page: friendly localized error with a retry and the "Create your own result" invite; never a stack trace or provider detail.

## Permission Model Expectations

No accounts, roles, or auth — every surface stays public and anonymous. Access to a shared result is **capability-based**: possession of the unguessable UUID grants view access until expiry. This public-by-link behavior is intentional and documented (privacy doc + product copy). Rate limiting applies to create and read. Never exposed: any image (none is accepted), server internals, stack traces, provider errors, or raw cached payloads. The optional delete requires only the id (best-effort, idempotent); it grants no listing or enumeration capability.

## Localization / Content Expectations

All static UI strings (modal labels, page states, countdown text, disclaimer framing, "Create your own result") go through i18n (`apps/web/src/i18n`) in en and ar. The stored `languageCode` drives the page's dynamic result language; the result text itself is served exactly as it was validated (already localized). Share text is localized, but **public-figure candidate names are never translated** (common public spelling only). Wording stays playful visual-similarity language; forbidden everywhere (copy and any served result field, enforced by `packages/shared/src/constants/safety.constants.ts`): "face recognition", "facial recognition", "identity match", "biometric", "you are …", "we identified", and the sensitive-topic list. The public page must never claim to know who anyone is.

## Analytics / Notification Expectations

Not applicable — Twinzy has no analytics, tracking, or notification product surface by design (anonymous, no accounts, no persistence); accepted by Ihab. Operational visibility is provided instead by structured pino logs containing metadata only (share create/read/delete outcomes, cache size, evictions, TTL expiries, error `messageKey`s, durations — never result content, never image data, never raw payloads) and the existing health endpoint.

## Product Definition of Done

- [ ] All user stories S1–S7 satisfied with their Must criteria observable in the running app
- [ ] Create validates + re-safety-filters + rejects image/base64/`data:`/oversized; returns `{shareId, shareUrl, createdAt, expiresAt, ttlSeconds}`
- [ ] Read returns active records or a safe not-found/expired error; expired records are never returned
- [ ] Public page renders all result content, never the image, with a live countdown and expired/not-found states
- [ ] Share modal offers Web Share API + copy-link + 7 URL-encoded platform targets; UUID-only URLs; localized text; names untranslated
- [ ] Cache is bounded (TTL + sweeper + `OnModuleDestroy` + item/byte caps; reject at capacity); no unbounded growth
- [ ] Out-of-scope items remain out of scope (no DB/auth/payments/persistence/Redis/image)
- [ ] All error states above implemented via `ApiErrorResponse` + i18n copy
- [ ] Permission/rate-limit/public-by-link behavior implemented and documented
- [ ] Analytics section confirmed Not applicable; log redaction verified (no payloads/images)
- [ ] Accessibility (modal + page + countdown), RTL, dark mode, and mobile-first verified; `noindex/nofollow` + safe OG present
- [ ] Quality gates green: lint 0/0, typecheck, coverage 95/90/95/95 on touched modules, knip, madge, trivy

## Sign-Off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Product owner | Ihab | approve | 2026-07-08 |

## Evidence And References To Attach

- Reused contract: `packages/shared/src/schemas/game-result.schema.ts` (`FinalGameResultSchema`)
- Safety wording canon: `packages/shared/src/constants/safety.constants.ts`
- Existing share affordance: `apps/web/src/modules/game/hooks/useShareResult.hook.ts`, `components/share-button.component.tsx`
- Governing rules: `rules/12-i18n.md`, `rules/13-accessibility.md`, `rules/14-ai-safety.md`
- Config knobs: `SHARE_RESULT_TTL_SECONDS`, `SHARE_RESULT_CACHE_DRIVER`, `SHARE_RESULT_MAX_PAYLOAD_BYTES`, `SHARE_RESULT_MAX_ACTIVE_ITEMS`, `SHARE_RESULT_PUBLIC_BASE_URL`
- Rollback reference: revert feature commits; stateless — no data migrations exist; a redeploy clears the in-memory cache

## Phase Blockers

None open. Verified against the blocker list: acceptance criteria are observable and testable (endpoint behavior, rendered page states, countdown, modal encoding, cache bounds); non-goals are written; error states are enumerated including capacity, expiry, malformed UUID, and rate limit; permission/public-by-link behavior is written, not assumed; the definition of done is product-behavioral, not engineering-only.
