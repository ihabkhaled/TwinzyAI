# 10 - Engineering Standards Check

- Request ID: TWZ-SHARE-001
- Feature: temporary-shareable-results
- Date: 2026-07-08
- Owner / approver: Ihab
- Track: standard (new public surface + in-memory payload caching; no AI-pipeline change)

## Purpose

Freeze the implementation rules before coding begins for the temporary-share feature: a `ShareResultCachePort` with a bounded in-memory TTL adapter, three `/api/v1/share-results` endpoints (create/read/optional delete), five zod-validated env vars, a public `/share/{uuid}` page with a live countdown, and a multi-platform share modal wired into the existing result screen.

## Step-by-Step Workflow

1. Reviewed `rules/00-non-negotiable-rules.md`, then the touched topic rules: 01/16 (architecture), 05/10 (types-constants, library wrapping), 06 (secure coding / config), 12 (i18n), 13 (a11y), 14 (AI/result safety), 18/21 (controllers, DTO validation), 22 (observability), 09 + `testing/` (tests/coverage), 24 (release gate), plus `docs/sdlc/engineering-standards.md` and `context/architecture-map.md`.
2. Request-specific rules identified and recorded below (no-DB cache-behind-a-port, image rejection on ingest, memory bounds, public-by-link discipline, config-driven caps, frontend module placement).
3. Compliance approach per standard area recorded in the matrix below.
4. One candidate permanent rule identified (ephemeral caches must be bounded and abstracted behind a port); update path recorded in the Permanent Policy Update Check.

## Standards Review Matrix

| Standard area | Requirement | How this request will comply |
| --- | --- | --- |
| Architecture boundaries (`rules/01`, `rules/16`) | One-way layers; thin controllers; every external state/lib behind an adapter; no cross-module internal imports | New `share-results` module: thin controller (one delegation per endpoint) → use-cases → validation/safety service → `ShareResultCachePort` (interface + DI token) → in-memory TTL adapter (the **only** place the raw `Map` lives). No import into `modules/game`/`modules/ai` internals; the frontend share code lives inside `modules/game` to keep the dependency graph acyclic (madge-enforced) |
| Naming and module structure (`rules/05`, `rules/10`) | Shared structure in `packages/shared`; no TS `enum`; no inline definitions; ownership-based filenames | `shareId` UUID schema + create/read response schemas in `packages/shared` (Zod `strict()` + derived types); `SHARE_RESULT_CACHE_DRIVER` and throttle limits as `as const` objects; zero inline schemas/types/constants in controllers, use-cases, adapters, hooks, or TSX; `lib` helpers named by intent (share-id, expiry, url) |
| Error handling (envelope, `rules/18`, `rules/21`) | Strict DTOs; `AppError` + `messageKey`; no provider/internal errors to client; terminal states | Create DTO reuses `FinalGameResultSchema` and rejects unknown keys, oversized bodies, image/base64/`data:` content; read DTO validates the UUID; unknown/expired reads → safe not-found `messageKey`; cache capacity → safe "try later" `messageKey`; never a stack trace, raw payload, or 500 leak |
| Logging and observability (`rules/22`) | Structured metadata-only logs; no sensitive leakage | Log create/read/delete outcomes, cache item count, evictions, TTL expiries, capacity rejections, rate-limit hits, durations; **never** result content, raw payloads, or image data (none exists); redaction verified |
| Accessibility (`rules/13`) | Keyboard, ARIA, contrast, reduced motion, no color-only status | Share modal and public page are keyboard-operable with focus management + ARIA; the countdown is announced accessibly (no screen-reader spam); expired/not-found states are screen-reader-friendly; color is never the only status signal; validated at 320/375/390/414 widths; reduced motion respected |
| Localization / content (`rules/12`) | All user-facing text through i18n; RTL preserved | Modal labels, page states, countdown text, disclaimer framing, and "Create your own result" via next-intl (en/ar); share text localized; **public-figure candidate names never translated**; the stored `languageCode` drives the page's result language; RTL logical spacing + dark mode preserved |
| Secure coding / config (`rules/06`) | Config-only `process.env`; bounded input/output; rate limits; no injection | Five caps/URLs go through the typed, zod-validated, fail-fast config (`env.schema.ts` + `env-bounds.constants.ts` + `app-config.service.ts`); no service reads env directly; create + read rate-limited; payload byte cap + item cap; UUID validated; the page escapes all text (no `dangerouslySetInnerHTML`); share-target URLs are URL-encoded |
| Privacy / result safety (`rules/14`) | No image persistence; validated + safety-filtered content only; no identity/biometric wording | **No image bytes/url/hash/metadata/embeddings** are ever accepted, stored, returned, or rendered — image/base64/`data:` content is rejected on ingest; only the already-validated `FinalGameResult` is cached, re-run through the forbidden-wording/sensitive-topic filter before storage; public-by-link is documented; the cache is memory-only, TTL-bounded, and self-deleting |
| Testing and coverage (`rules/09`, `testing/`) | Tests first; 95/90/95/95 on touched modules; scenario-rich negative coverage | Tests before implementation: schema accept/reject, cache TTL/eviction/caps/cleanup, expiry helpers, image/oversized/capacity rejection, endpoint happy+abuse paths, countdown ticking/zero/cleanup, page states, modal encoding, no-image assertions, e2e create→open-in-fresh-context→expired; deterministic clock; coverage gate 95/90/95/95 on all touched modules |
| Documentation | Docs ship in the same delivery stream | README "How it works"/sharing, `docs/architecture.md`, `context/architecture-map.md`, `docs/privacy-and-data-retention.md`, `docs/env-vars.md`, `memory/known-pitfalls.md`, and this feature's artifact set |
| Release readiness (`rules/24`) | All gates green; rollback defined | `npm run lint` (0/0, no inline suppressions), typecheck (tsgo), `test:unit`, `test:integration`, `test:e2e`, `test:coverage`, `test:pwa`, `build`, `validate`, knip, madge, trivy; rollback = revert feature commits (stateless, no DB; a redeploy also clears the cache) |

## Request-Specific Rules

- The share store is **never** a database and **never** raw-accessed outside its adapter: all storage goes through `ShareResultCachePort`; the in-memory `Map` lives only in the `infrastructure` adapter; Redis/Valkey is a future adapter behind the same port.
- The in-memory cache must be bounded and self-reclaiming: TTL (lazy expiry on read **and** a periodic sweeper), `OnModuleDestroy` cleanup (clear map + timer), a max-active-items cap, and a max-payload-bytes cap; at capacity, new creates are rejected with a safe `messageKey` — memory can never grow unbounded.
- **No image, ever, in the share flow:** the create endpoint rejects any field containing image-like content (`data:` URIs, base64 image blobs, image URLs) in addition to strict schema validation; no image field is accepted, stored, returned, or rendered.
- Only the already-validated, safety-filtered `FinalGameResult` may be cached; the create use-case re-runs the forbidden-wording/sensitive-topic filter before storage; the public page escapes all text and uses **no** `dangerouslySetInnerHTML`.
- `shareId` is a crypto-random UUID (`crypto.randomUUID`), validated as a UUID on read; the public page is served `noindex, nofollow` with a generic safe Open Graph card (no result specifics, no image); nothing identifies the user.
- All timing/caps/URLs are config-driven through the typed zod config (five vars, fail-fast); no hardcoded TTLs, caps, or base URLs anywhere; `.env.example` and local `.env` update in the same slice.
- Both create and read are rate-limited via `@nestjs/throttler` `as const` route limits (`SHARE_CREATE_THROTTLE`, `SHARE_READ_THROTTLE`), following the existing `ANALYZE_THROTTLE` pattern.
- The frontend share code (create mutation, modal, public-page container, countdown hook, share-target helpers) lives inside `modules/game` to reuse result components and avoid a circular module dependency; the route file only imports the container from `@/modules/game`.
- The AI pipeline (prompts, adapter, upload chain) is not touched; safety constants are reused read-only from `packages/shared` — no import into `modules/ai` internals.
- Errors are `AppError` + `messageKey`; logs are metadata-only; no stack traces, provider errors, raw payloads, or result content are ever logged.

## Permanent Policy Update Check

- New permanent rule discovered: yes (one candidate)
- If yes, describe the rule: any server-side ephemeral cache/store introduced in this repository must be (a) abstracted behind a port/DI token so its backing implementation is swappable, and (b) hard-bounded and self-reclaiming — a TTL with lazy expiry + a sweeper, an explicit max-items and/or max-bytes cap that rejects new writes at capacity, and `OnModuleDestroy` teardown — so memory can never grow unbounded. It must never persist images or raw payloads and must log metadata only.
- `rules/` updated: pending — to be recorded in `rules/16-backend-architecture.md` (and/or `rules/22-observability`) during phase 14 in the same delivery stream, plus `architecture/adrs/adr-004-ephemeral-share-result-cache-port.md`
- `CLAUDE.md` / `AGENTS.md` mirror updated: pending — only if the rule is confirmed as repository-permanent at phase 23; the existing Twinzy constraints (free, no DB, no auth, no payments, no image persistence, visual-similarity wording, safety-filtered output, no `enum`) are unchanged and need no edit
- Decision recorded in `memory/`: pending — `memory/known-pitfalls.md` entry (cache-port + bounded-cache + Redis-later + memory-only limitation) in the same delivery stream

## Exit Checklist

- [x] Standards reviewed (rules 00, 01, 05, 06, 09, 10, 12, 13, 14, 16, 18, 21, 22, 24 + testing/ + engineering-standards.md)
- [x] Request-specific rules documented (nine rules above)
- [x] Permanent-rule update decision made (one candidate rule, update path assigned)
- [x] Implementation constraints are visible to the team (this artifact + linked canon)

## Sign-Off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Technical owner | Ihab | approve | 2026-07-08 |

## Evidence And References To Attach

- `rules/00-non-negotiable-rules.md`, `rules/16-backend-architecture.md`, `rules/14-ai-safety.md`, `rules/06-*` (config/secure coding), `rules/12-i18n.md`, `rules/13-accessibility.md`, `rules/21-dto-validation.md`, `rules/24-release-gate.md`
- `context/architecture-map.md`, `docs/sdlc/engineering-standards.md`, `testing/README.md`
- Reused canon: `packages/shared/src/schemas/game-result.schema.ts`, `packages/shared/src/constants/safety.constants.ts`; config `apps/api/src/config/*`; throttle `apps/api/src/modules/game/model/game.constants.ts`
- Mechanical enforcement: `eslint.config.mjs` + `eslint/` layer-boundary plugin, `tsconfig.base.json`, Husky hooks under `.husky/`
- Related artifacts: `docs/features/temporary-shareable-results/08-architecture-review.md`, `09-impact-analysis.md`, `11-test-strategy.md`, `12-coverage-plan.md`

## Phase Blockers

Do not close this phase if:

- request-specific constraints are only in someone's head — cleared: all nine are written above
- permanent-rule implications were noticed but not reflected in `rules/` and the `CLAUDE.md` mirror — tracked: the bounded-ephemeral-cache-behind-a-port rule has an assigned pending update in `rules/16` + `memory/` + `adr-004` within this delivery stream; closing phase 23 without it is a blocker
- implementation standards still differ between people working the change — cleared: single owner (Ihab); this artifact is the frozen reference
