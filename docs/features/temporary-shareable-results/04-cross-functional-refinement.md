# 04 - Cross-Functional Refinement

- **Request ID:** TWZ-SHARE-001
- **Feature:** temporary-shareable-results
- **Date:** 2026-07-08
- **Owner / approver:** Ihab (product + engineering)
- **Track:** standard — major feature; new public surface + in-memory caching, no AI-pipeline change
- **Source:** owner product request (2026-07-08)

## Purpose

Align product intent with engineering, QA, security, operations, support, and analytics before planning is finalized for the temporary-share feature: a no-DB, TTL-bounded, in-memory share cache behind a port; three `/api/v1/share-results` endpoints; a public `/share/{uuid}` page with a live countdown; and a multi-platform share modal on the result screen.

## Step-by-Step Workflow

1. Reviewed the stories and acceptance criteria against the existing game module, shared contracts, config layer, and error/throttle patterns.
2. Surfaced hidden work: the cache-port + bounded adapter (eviction/TTL/caps/shutdown), ingest image-rejection beyond the schema, UUID validation, the frontend module-placement decision (avoid a circular dependency), and `noindex`/OG metadata.
3. Identified integration points (config, throttler, error envelope, i18n, existing result components) and operational concerns (memory bounds, log redaction, multi-instance/restart behavior).
4. Recorded decisions, open questions, and owners below. Twinzy is a single-owner project; this refinement was executed as a structured async self-review with Ihab covering each function's checklist explicitly.

## Participants

| Function | Name | Participation type |
| --- | --- | --- |
| Product | Ihab | required |
| Engineering | Ihab | required |
| QA | Ihab | required |
| Security | Ihab (AppSec hat — mandatory here: new public surface + payload caching) | required for this request |
| DevOps / SRE | Ihab | as needed — reviewed (memory bounds, throttling, observability, restart behavior) |
| Support | Ihab | as needed — reviewed (docs, known-behavior notes) |
| Analytics | Ihab | as needed — reviewed, concluded not applicable (no analytics system by design) |
| Other | Ihab (privacy reviewer hat, per rules/14) | required for this request |

## Findings by Function

### Engineering

- New backend module `apps/api/src/modules/share-results` in the standard anatomy: thin controller (one delegation per endpoint) in `api`; create/read/(delete) use-cases in `application`; a focused validation+safety service; `ShareResultCachePort` (interface + DI token) in `model`; a bounded in-memory TTL cache adapter in `infrastructure`; pure helpers in `lib` (share-id generation via `crypto.randomUUID`, expiry math `expiresAt`/`remainingSeconds`, and share-url building from `SHARE_RESULT_PUBLIC_BASE_URL`).
- Hidden work in the cache adapter: TTL enforcement (lazy expiry on read **and** a periodic sweeper), `OnModuleDestroy` cleanup (clear the map + stop the timer so no dangling handle), a max-active-items cap and a max-payload-bytes cap (reject new creates at capacity), and metadata-only size/eviction logging. The raw cache client/`Map` must live only inside the adapter — the rest of the module depends on the port.
- Ingest safety is more than schema validation: after `FinalGameResultSchema` passes, re-run the forbidden-wording/sensitive-topic filter over the served text fields and **reject any image-like content** (`data:` URIs, base64 image blobs, image URLs) anywhere in the payload. The `FinalGameResult` has no image field today, but the guard must be explicit and tested so the invariant holds structurally.
- Shared contracts (`packages/shared`): a `shareId` UUID schema, a create-response schema (`shareId`, `shareUrl`, `createdAt`, `expiresAt`, `ttlSeconds`), and a read-response schema (`shareId`, `languageCode`, `result`, `createdAt`, `expiresAt`, `remainingSeconds`); the create request reuses `FinalGameResultSchema`. All Zod `strict()`, no inline definitions, no TS `enum`.
- Config: five new env vars in `env.schema.ts` with min/max/default in `env-bounds.constants.ts` and typed accessors in `app-config.service.ts`; `SHARE_RESULT_CACHE_DRIVER` is an `as const` union (`memory` today) that selects the adapter, leaving room for `redis` without a schema break. `.env.example` updated (and local `.env` per the memory note).
- Throttling: reuse the `@nestjs/throttler` per-route `as const` pattern (like `ANALYZE_THROTTLE`) with a `SHARE_CREATE_THROTTLE` and `SHARE_READ_THROTTLE`.
- Frontend hidden work and a real trap: to reuse the existing result components and **avoid a circular module dependency**, the share-create call, the share modal, and the public-page container all live inside the existing `modules/game` module; the new route file `app/share/[shareId]/page.tsx` only imports the container from `@/modules/game`. A new `modules/share` importing game's result components (and game importing share's modal) would be circular — madge would catch it, but the placement decision avoids it by design. The existing `useShareResult` clipboard hook is extended/complemented by a create-link mutation and a countdown hook.
- No DB, no migrations, stateless: rollback is a commit revert; a redeploy also clears the in-memory cache.

### QA

- Test surface (written first): shared schema tests (create/read shapes, UUID acceptance/rejection, `FinalGameResult` reuse); backend unit (cache TTL expiry, sweeper reclamation, `OnModuleDestroy` cleanup, item-cap and byte-cap rejection, expiry-math helpers, share-url builder, image/base64/`data:` rejection, safety re-filter); backend integration (create→read happy path; create→wait→read returns not-found; unknown/malformed UUID → safe error; oversized payload rejected; capacity rejection; 429 on abuse; delete idempotency); frontend unit/component (countdown ticking + zero transition + unmount cleanup, loading/active/expired/not-found states, modal targets + URL encoding, no image rendered, no `dangerouslySetInnerHTML`); e2e (create link → open in a **fresh browser context** → see result + countdown → expired state).
- Deterministic time is essential: the countdown and TTL tests must control the clock (fake timers / injected clock) — no arbitrary sleeps.
- Regression scope: result screen still works; existing `useShareResult` copy path preserved; RTL/dark/mobile viewports; the app compiles against the reused `FinalGameResultSchema` unchanged.
- Coverage gate stays 95/90/95/95 on touched modules; the new cache adapter and use-cases are in scope, not exempt.

### Security

- New public surface: `/share/{uuid}` serves result content to anyone with the link. Mitigations: crypto-random UUID (unguessable), short TTL, `noindex/nofollow`, generic safe Open Graph (no result specifics, no image), rate-limited read, nothing identifying in the payload. Public-by-link is an accepted, documented risk.
- Ingest is a new trust boundary: strict `FinalGameResultSchema` (rejects unknown keys), byte-cap before/at parse, re-run safety filter, and explicit image/base64/`data:` rejection. The endpoint accepts JSON only — no multipart, no file.
- Memory-safety is a security concern here: unbounded caching is a DoS vector, so the item cap + byte cap + TTL + sweeper are security controls, not just hygiene; capacity rejection must be a safe error.
- Output safety on the page: escape all model/user-derived text; **no `dangerouslySetInnerHTML`**; the safety filter already ran on ingest, so the page renders only validated, filtered text.
- Logging discipline: never log result content, raw payloads, image data (none exists), stack traces, or provider errors; all failures are `AppError` + `messageKey`.
- Sign-off needs: phase 19 threat model + security review are mandatory before release (new externally reachable surface + payload caching). Trivy must stay green.

### DevOps / SRE

- No infrastructure change: no DB, no Redis, no new service/queue/job. Two hot routes need throttler config; five new env vars flow through the typed config and `.env.example`.
- Observability: metadata-only structured logs — share create/read/delete outcomes, current cache item count, evictions, TTL expiries, capacity rejections, rate-limit hits, and per-request durations; never result content or payloads.
- Capacity/restart behavior: memory is bounded by item + byte caps; a restart/deploy clears the cache (live links drop early) — documented as expected. Multi-replica is out of scope for the memory adapter; the Redis path is documented for when it is needed.
- Rollout/rollback: single atomic deploy; rollback = revert feature commits (no data/config migration). `SHARE_RESULT_PUBLIC_BASE_URL` must be set correctly per environment so minted links point at the right host.

### Support / Operations

- User-visible changes to document: a new "Share result" modal (OS share sheet + platform buttons + copy link), a new public share page with a countdown, and an expired/not-found state.
- Known-behavior notes for docs: links expire after the TTL (default 10 min) and also disappear on a server restart/deploy — both are by design, not defects; the page never shows the uploaded image; nothing is stored permanently.
- README "How it works"/sharing section, privacy/data-retention doc, and env-vars doc updated in the same delivery stream.

### Analytics / BI

Not applicable — Twinzy is anonymous, free, and has no database or analytics/tracking system by design; this feature adds no events, reports, or data outputs, and deliberately does not track shares (accepted by Ihab).

## Open Questions

| Question | Owner | Due date | Status |
| --- | --- | --- | --- |
| Backend cache vs a purely client-side share (encode result in the URL)? | Ihab | 2026-07-08 | resolved — backend TTL cache + UUID. A URL-encoded result would leak full content in the link, defeat the countdown/expiry guarantee, and bloat URLs; the port keeps a clean Redis path |
| New `modules/share` vs placing share code inside `modules/game`? | Ihab | 2026-07-08 | resolved — inside `modules/game` to reuse result components and avoid a circular module dependency; the route imports the container from `@/modules/game` |
| Build the Redis/Valkey adapter now? | Ihab | 2026-07-08 | resolved — no. Document it as the production extension of `ShareResultCachePort`; do not ship untested/dead infra (no Redis host exists today) |
| Slim share DTO vs reusing the full `FinalGameResult`? | Ihab | 2026-07-08 | resolved — reuse the full validated `FinalGameResultSchema`; it guarantees parity with the result page and reuses the strict, safety-checked contract; body size bounded by `SHARE_RESULT_MAX_PAYLOAD_BYTES` |
| Can Playwright e2e run reliably in this Windows environment (browser install/sandbox constraints)? | Ihab | before merge | open — verify during phase 15; if blocked, document the exact environment blocker per policy instead of skipping silently |

## Captured Decisions

- Backend, port-based temporary cache with a bounded in-memory TTL adapter now; Redis/Valkey documented as the production extension of the same `ShareResultCachePort` (not built now to avoid dead infra).
- Share code (create mutation, modal, public-page container, countdown hook) lives inside `modules/game` to reuse result components and avoid a circular module dependency; the route file only imports the container.
- The create endpoint reuses the full `FinalGameResultSchema`; the shared page is guaranteed to match the result page.
- Ingest re-runs the safety filter and explicitly rejects any image/base64/`data:` content, in addition to strict schema validation and a payload byte cap.
- The cache is hard-bounded: TTL (lazy expiry + sweeper) + `OnModuleDestroy` cleanup + max-active-items + max-payload-bytes; creates are rejected at capacity — memory can never grow unbounded.
- Public-by-link is accepted and documented: unguessable UUID, short TTL, `noindex/nofollow`, generic safe OG, nothing identifying.
- Five env vars are config-driven, zod-validated, fail-fast; `SHARE_RESULT_CACHE_DRIVER` is an `as const` union leaving room for `redis`.
- All existing invariants reconfirmed as unchangeable: free game, no payments/accounts/auth/DB, no image persistence anywhere, playful visual-similarity wording only, safety-filtered output, no TS `enum`, no inline definitions, strict gates (lint 0/0, typecheck, coverage 95/90/95/95, knip, madge, trivy).

## Exit Checklist

- [x] Impacted functions reviewed
- [x] Hidden work exposed
- [x] Missing requirements captured
- [x] Open questions assigned
- [x] Cross-functional risks documented

## Sign-Off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Technical owner | Ihab | approve | 2026-07-08 |
| Product owner | Ihab | approve | 2026-07-08 |

## Evidence And References To Attach

- Participant list: solo async self-review by Ihab (all function hats, checklists above) — no meeting artifact exists for a one-person team.
- Repo canon consulted: `context/architecture-map.md`, `rules/00-non-negotiable-rules.md`, `rules/14-ai-safety.md`, `rules/16-backend-architecture.md`; config canon `apps/api/src/config/*`; throttle pattern `apps/api/src/modules/game/model/game.constants.ts`.
- Reused contract + safety canon: `packages/shared/src/schemas/game-result.schema.ts`, `packages/shared/src/constants/safety.constants.ts`.
- Every open question above carries an explicit owner (Ihab) and a due phase.

## Phase Blockers

Do not close this phase if:

- major impacted functions have not reviewed the request — none remaining; all functions reviewed above
- hidden work is still being discovered informally — captured in Findings by Function (cache bounds, image rejection, module placement, metadata)
- open questions have no owners — all owned by Ihab; only the Playwright environment question remains open and gates phase 15
- cross-system implications were mentioned verbally but not captured — all captured in this artifact

No blockers remain; the single open question (Playwright e2e environment) is owned, dated, and gates phase 15 rather than this refinement phase.
