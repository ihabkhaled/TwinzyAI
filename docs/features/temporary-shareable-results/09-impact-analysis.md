# 09 - Full Impact Analysis

- **Request ID:** TWZ-SHARE-001 · **Feature:** temporary-shareable-results · **Date:** 2026-07-08
- **Owner / approver:** Ihab (product + engineering) · **Track:** standard · **Severity:** major feature (new public surface + in-memory payload caching; no AI-pipeline change)

## Purpose

Reveal the full blast radius so no team or system is surprised later.

## Step-by-Step Workflow

1. Reviewed impact across both apps, shared contracts, config, security/privacy, tooling, QA, support, docs, and monitoring (table below).
2. Documented compatibility, contract-migration, monitoring, support, and compliance implications for the new `share-results` module, the temporary in-memory cache, the public `/share/{uuid}` page, and the share modal.
3. Assigned owner (Ihab for all areas — solo maintainer) and mitigation per area.

## Affected Systems

| System / area | Impact summary | Owner | Action required |
| --- | --- | --- | --- |
| Frontend (`apps/web`) | New public route `app/share/[shareId]/page.tsx` (`noindex/nofollow` + generic safe OG, imports a container from `@/modules/game`). Inside `modules/game`: public share-result container (loading/active/expired/not-found), a 1-second countdown hook from server `expiresAt` (cleaned up on unmount, expired transition at zero), a share modal (Web Share API + copy-link + WhatsApp/Telegram/Facebook/X/LinkedIn/Email/Reddit), share-target helpers, and wiring of the result screen's "Share result" to create a link + open the modal. | Ihab | Reuse existing result components; never render the image; no `dangerouslySetInnerHTML`; preserve RTL/dark/mobile-first (320–414px); component/hook/gateway tests; place share code inside `modules/game` to avoid a circular dependency. |
| Backend (`apps/api`) | New `modules/share-results`: thin controller (`POST`/`GET`/optional `DELETE` under `/api/v1/share-results`); create/read/delete use-cases; a validation/safety service (re-filter + reject image/base64/`data:` + byte cap); `ShareResultCachePort` + DI token; a bounded in-memory TTL adapter; pure `lib` helpers (share-id, expiry, url). Two throttler route limits. | Ihab | Controller stays thin; raw cache client only inside the adapter; `AppError`/`messageKey` errors; metadata-only logs. |
| Shared contracts (`packages/shared`) | Additive: `shareId` UUID schema, create-response schema (`shareId`, `shareUrl`, `createdAt`, `expiresAt`, `ttlSeconds`), read-response schema (`shareId`, `languageCode`, `result`, `createdAt`, `expiresAt`, `remainingSeconds`); the create request **reuses `FinalGameResultSchema`** unchanged. | Ihab | Define once in shared, Zod `strict()`, derived types, no `enum`, no inline defs. |
| Config (`apps/api/src/config`) | Five new env vars: `SHARE_RESULT_TTL_SECONDS` (600, 60–3600), `SHARE_RESULT_CACHE_DRIVER` (`memory`), `SHARE_RESULT_MAX_PAYLOAD_BYTES` (50000), `SHARE_RESULT_MAX_ACTIVE_ITEMS` (1000), `SHARE_RESULT_PUBLIC_BASE_URL` (`http://localhost:3000`). | Ihab | Add to `env.schema.ts` + bounds in `env-bounds.constants.ts` + typed accessors in `app-config.service.ts`; fail-fast; update `.env.example` (and local `.env`). |
| AI pipeline (prompts, safety filter, provider adapter) | **Not touched.** No prompt, adapter, or model change. The shared safety constants are reused **read-only** to re-filter shared payloads on ingest. | Ihab | Confirm no import into `modules/ai` internals; reuse safety constants only from `packages/shared`. |
| Upload security chain | **Not touched.** The upload/consent/analyze flow is unchanged; the share flow never involves a file or the image. | Ihab | Architecture test: the share module accepts JSON only and rejects any image/base64/`data:` content. |
| DevOps / platform (Docker, CI, hooks) | No new services, images, or DB. Five new env vars (safe defaults); two throttler limits. All existing gates must stay green: lint 0/0, typecheck, coverage 95/90/95/95 on touched modules, knip, madge, trivy, plus `test:pwa`. | Ihab | Standard rebuild/redeploy; set `SHARE_RESULT_PUBLIC_BASE_URL` per environment. |
| QA automation (Vitest, Playwright) | New suites: shared schema tests; backend unit (cache TTL/eviction/caps/cleanup, expiry helpers, image rejection, url builder) + integration (create→read→expire, unknown/malformed UUID, oversized/capacity/429, delete idempotency); frontend unit/component (countdown, states, modal encoding, no-image); e2e (create→open-in-fresh-context→countdown→expired); architecture tests. | Ihab | Write tests first; deterministic clock for TTL/countdown; note the e2e/browser environment constraint and document any un-runnable layer. |
| Security / privacy | New public surface + payload caching. Attack surface: public-by-link viewing, unbounded-memory DoS, image smuggling on ingest, UUID guessing, output injection on the page. Mitigations: crypto UUID, TTL + item/byte caps + sweeper, strict schema + image rejection + safety re-filter, `noindex/nofollow` + safe OG, escaping (no `dangerouslySetInnerHTML`), rate limits, redacted logs. | Ihab | Threat model + security review (phase 19) must cover the endpoint and the page before release. |
| Support | User-visible: a new share modal, a public share page with a countdown, and an expired/not-found state. | Ihab | Update README "How it works"/sharing; document that links expire (TTL) and also drop on restart/deploy — both by design; the image is never shown. |
| Documentation (rules, memory, runbooks) | README, `docs/architecture.md`, `context/architecture-map.md`, `docs/privacy-and-data-retention.md`, `docs/env-vars.md`, `memory/known-pitfalls.md` (cache-port + Redis-later + restart-drops-links), plus this feature's artifact set. | Ihab | Ship doc updates in the same delivery stream. |
| Monitoring / logs | New signals: share create/read/delete outcomes, cache item count, evictions, TTL expiries, capacity rejections, rate-limit hits, per-request durations. Logs remain metadata-only — never result content, raw payloads, or image data (none exists). | Ihab | Structured log coverage for the three routes; watch cache size/growth during hypercare. |

## Backward Compatibility

- **No external consumers.** The only client of `apps/api` is `apps/web`, deployed together from this monorepo. No SDKs, no partner integrations, no stored data. No compatibility window is required.
- **Everything is additive.** Three new routes, two new shared schemas, five new env vars with safe defaults, one new frontend route — nothing existing changes shape. The create request reuses `FinalGameResultSchema` unchanged.
- **`SHARE_RESULT_CACHE_DRIVER` is forward-compatible:** an `as const` union that is `memory` today and will accept `redis` additively without a contract break.
- **PWA:** a stale service-worker client simply lacks the new route/modal until it updates; because nothing is persisted, there is no migration and the worst case is a normal service-worker refresh. Accepted by Ihab.

## Data Migration Needs

No database exists — no schema migrations or backfills, ever (stateless by design). What does change:

- **Contract addition in `packages/shared`:** new share schemas (additive); the create request reuses the existing `FinalGameResultSchema`. Both sides ship in one release.
- **Env/config:** five new variables added to the typed, zod-validated config layer with safe defaults; `.env.example` and local `.env` updated in the same slice; documented in `docs/env-vars.md`. `SHARE_RESULT_PUBLIC_BASE_URL` must be set per environment.
- **Cache/PWA invalidation:** standard service-worker versioning on deploy; the in-memory share cache is cleared by any restart/deploy (by design — live links drop early); no manual invalidation steps.

## Monitoring Impact

- **New failure modes:** create rejected (invalid/oversized/forbidden-wording/image-like/capacity), read not-found/expired, rate-limit 429 — all terminal, observable, and returned as `AppError` + `messageKey` (never a stack trace or provider error).
- **New signals to watch:** current cache item count and growth trend (must stay bounded), eviction/TTL-expiry rate, capacity-rejection rate (a sign to raise the cap or investigate abuse), create/read request rates, and rate-limit rejections (possible probing).
- **Log discipline (re-verified):** metadata-only structured logs; **never** result content, raw payloads, or image data. The share page renders only validated, safety-filtered, escaped text.

## Support and Training Impact

Single-maintainer product (Ihab) — no support team to train. The support surface is the documentation itself:

- README "How it works"/sharing describes temporary, self-expiring, no-DB sharing (unguessable link, live countdown, no image, nothing stored permanently).
- Known-behavior notes: links expire after the TTL (default 10 min) **and** disappear on a server restart/deploy — both are by design, not defects; the expired/not-found page always offers "Create your own result".
- `memory/known-pitfalls.md` records the cache-port + Redis-later decision and the memory-only/multi-instance limitation so future sessions (human or AI) inherit it.

## Compliance / Privacy Impact

All privacy guarantees are preserved; the retention story is explicitly analyzed and minimized:

- **Unchanged invariants:** free game, no payments/accounts/auth/DB; **no image bytes/url/hash/metadata/embeddings** anywhere in the share flow; no face recognition, identity matching, or biometric anything; playful visual-similarity wording only, safety-filtered.
- **New, minimal, temporary retention:** only the already-validated, safety-filtered `FinalGameResult` (plus `shareId`/`createdAt`/`expiresAt`/`languageCode`) is held in **server memory** under a hard TTL (default 10 min) and item/byte caps; it self-deletes on expiry (lazy + sweeper) and is cleared on shutdown. Nothing is written to disk; nothing identifies the user.
- **Public-by-link is a documented, accepted risk:** anyone with the unguessable UUID can view the result until expiry; there is no auth by invariant. Mitigations: unguessable id, short TTL, `noindex/nofollow`, generic safe OG, nothing identifying. Recorded in `docs/privacy-and-data-retention.md`.
- **`languageCode` is not PII** (a locale preference); no other identifier is stored.
- **Sensitive-inference bans preserved:** the shared payload is the same visible-traits-only result, re-safety-filtered on ingest; the page escapes all text.
- Contracts/SLA and client-approval obligations: Not applicable — free anonymous consumer game with no contracts, SLAs, or external clients (accepted by Ihab).

## Exit Checklist

- [x] Affected systems documented
- [x] Affected teams documented (single owner: Ihab across all areas)
- [x] Compatibility impact documented (all additive; single co-deployed client)
- [x] Migration needs documented (contract/config addition; no persistence)
- [x] Monitoring impact documented
- [x] Support impact documented

## Evidence And References To Attach

- Sibling artifacts: `docs/features/temporary-shareable-results/08-architecture-review.md`, `11-test-strategy.md`, `19-threat-model.md` (phase 19 must cover the public surface + ingest safety + memory bounds)
- Reused contract + safety canon: `packages/shared/src/schemas/game-result.schema.ts`, `packages/shared/src/constants/safety.constants.ts`, `rules/14-ai-safety.md`
- Config canon: `apps/api/src/config/env.schema.ts`, `env-bounds.constants.ts`, `app-config.service.ts`
- Architecture canon: `context/architecture-map.md`, `rules/00-non-negotiable-rules.md`, `rules/16-backend-architecture.md`
- Rollback reference: revert the feature commits — the app is stateless with no DB and a redeploy clears the in-memory cache, so revert is clean and complete.

## Phase Blockers

None open. All department impacts are assessed above (none deferred to "check later"), compatibility is closed-world (single co-deployed client, additive contracts), monitoring and support implications are recorded, and there are no migration needs because the product has no persistence beyond a short in-memory TTL. Residual risks (public-by-link exposure, memory bounds, image rejection, memory-only limitation, E2E environment constraints) carry named mitigations in the table above and are tracked forward into phases 11/12/19. Accepted by Ihab, 2026-07-08.
