# 11 - Test Strategy

- **Request ID:** TWZ-SHARE-001
- **Feature:** temporary-shareable-results
- **Date:** 2026-07-08
- **Owner:** Ihab (product + engineering)
- **Track:** standard — new public surface + in-memory payload caching; no AI-pipeline change

## Purpose

Design quality before implementation starts: define the test layers, negative/edge cases, environments, and evidence that will prove the share feature (create link, temporary bounded cache, read link, public page with live countdown, share modal) is correct, safe, privacy-preserving, and reversible.

## Step-by-Step Workflow

1. Mapped every acceptance criterion and risk from `03-product-requirements.md` and `09-impact-analysis.md` to test layers below.
2. Defined happy paths (create→read→render, share targets), unhappy paths (invalid/oversized/forbidden/image payload, capacity, unknown/malformed/expired UUID, rate limit), edge cases (countdown at zero, unmount cleanup, delete idempotency), and rollback validation.
3. Identified new test-case records for `test-cases/` (see Linked Test Case Files).
4. Tests are written **first** per slice (repo policy); evidence lands in `15-dev-validation-report.md`.

## Requirement-to-Test Matrix

| Requirement or risk | Unit | Integration | E2E | Security | Business / UAT |
| --- | --- | --- | --- | --- | --- |
| `POST /share-results` validates full `FinalGameResult`, re-safety-filters, rejects image/base64/`data:`, enforces byte cap, mints UUID, computes `expiresAt`, returns `{shareId, shareUrl, createdAt, expiresAt, ttlSeconds}` | ✔ create use-case + safety/image-reject helpers | ✔ full endpoint happy path + rejections | ✔ create from result screen | ✔ image/oversized/forbidden rejected | ✔ Ihab shares a real result |
| Bounded in-memory TTL cache: lazy expiry on read + sweeper + `OnModuleDestroy` cleanup + item cap + byte cap (reject at capacity) | ✔ adapter specs (TTL, sweep, teardown, caps) | ✔ create→wait→read = not-found; capacity rejection | — | ✔ unbounded-growth/DoS prevented | — |
| `GET /share-results/:shareId` returns active `{shareId, languageCode, result, createdAt, expiresAt, remainingSeconds}` or safe not-found/expired via `messageKey`; expired never returned | ✔ read use-case + expiry helpers | ✔ active read; unknown/malformed/expired UUID | ✔ open link renders result | ✔ no stack trace/provider leak | ✔ recipient sees the result |
| No image anywhere: not accepted, stored, returned, or rendered | ✔ image-reject helper; page render (no image) | ✔ adapter/record contains no image field | ✔ page never shows a photo | ✔ ingest rejects image/base64/`data:` | — |
| Public page: loading/active/expired/not-found states; live 1-second countdown from server `expiresAt`; cleaned up on unmount; expired transition at zero without a stale result | ✔ countdown hook (fake timers), state logic | — | ✔ watch countdown → expired | — | ✔ UX review |
| Share modal: Web Share API first; fallback copy-link + WhatsApp/Telegram/Facebook/X/LinkedIn/Email/Reddit; UUID-only URL; localized text; names untranslated | ✔ share-target helpers (URL encoding), modal logic | — | ✔ open modal, copy link | ✔ only UUID in URL; no result content in URL | ✔ share targets look right |
| `shareId` is crypto UUID; page `noindex/nofollow` + generic safe OG; nothing identifying | ✔ share-id generator, metadata builder | ✔ response headers/metadata | ✔ page metadata asserted | ✔ unguessable id; no indexable content | — |
| Both routes rate-limited; `AppError`+`messageKey`; metadata-only logs (no payloads/result/image) | ✔ error mapping | ✔ 429 on abuse; log inspection | — | ✔ no leakage in logs/errors | — |
| Optional `DELETE /share-results/:shareId` removes a record, idempotent | ✔ delete use-case | ✔ delete then read = not-found; delete unknown = safe | — | ✔ no enumeration capability | — |
| Config: five env vars zod-validated, fail-fast, bounded | ✔ env schema accept/reject; accessor tests | ✔ app boots with defaults | — | ✔ invalid config fails fast | — |
| No circular dependency (share code inside `modules/game`); raw cache client only inside adapter; no `enum`/`any`/inline defs; thin controller | ✔ architecture/lint tests | — | — | ✔ static gates as tests | — |
| RTL / dark / mobile-first / a11y preserved on modal + page | ✔ component a11y tests | — | ✔ AR RTL + a11y smoke + 375px | — | ✔ exploratory pass |
| Rollback: `git revert` + redeploy; stateless; redeploy clears cache | — | ✔ suites green on reverted tree (spot check) | ✔ release smoke test | — | ✔ Ihab confirms rollback drill |

## Test Layers

### Unit

Vitest, colocated `*.test.ts`, run via `npm run test:unit`. Standard: `testing/unit-testing-standard.md`.

- `packages/shared`: the `shareId` UUID schema (accept valid v4 UUIDs; reject non-UUID, empty, wrong-format); create/read response schemas (`strict()` shape, unknown-key rejection); confirmation that the create request reuses `FinalGameResultSchema`.
- `apps/api` cache adapter: `create` stores and returns a record; `get` returns active records and **never** an expired one (lazy expiry); the sweeper reclaims expired entries; `OnModuleDestroy` clears the map and stops the timer (no dangling handle); item cap rejects the (N+1)th create; byte cap rejects an over-large payload; `delete` is idempotent. Time controlled via fake timers / an injected clock — no sleeps.
- `apps/api` use-cases/helpers: create flow (schema ok → safety re-filter → image/base64/`data:` rejection → byte cap → UUID → `expiresAt` → store → `shareUrl`); read flow (UUID validation → active or safe not-found); expiry math (`computeExpiresAt`, `remainingSeconds`, `isExpired`); share-url builder from `SHARE_RESULT_PUBLIC_BASE_URL`; safety-filter over the served text fields.
- `apps/api` config: env schema accepts valid values and applies defaults; rejects out-of-bounds TTL/caps (fail-fast); typed accessors return parsed values.
- `apps/web`: countdown hook (ticks each second, reaches zero, cleans up on unmount), page state logic (loading/active/expired/not-found), share-target helpers (each platform's URL encoding, UUID-only URL, localized text, names untranslated), no-image render assertions.

### Integration / API

Vitest `*.integration.test.ts` (api-integration project), full Nest app via supertest, run via `npm run test:integration`. Standard: `testing/integration-testing-standard.md`.

- `POST /api/v1/share-results` with a valid `FinalGameResult`: 200 with `{shareId, shareUrl, createdAt, expiresAt, ttlSeconds}`; `shareUrl` uses the configured base URL and contains only the UUID.
- Rejections: unknown keys, wrong `promptVersion`, forbidden wording, an image/base64/`data:` string in any field, and an oversized body (> `SHARE_RESULT_MAX_PAYLOAD_BYTES`) all return `AppError` + `messageKey`; nothing is stored.
- `GET /api/v1/share-results/:shareId`: active read returns the full record; a create→advance-clock→read returns not-found (expired never served); unknown UUID and malformed UUID return safe errors; the response never contains an image field.
- Capacity: filling to `SHARE_RESULT_MAX_ACTIVE_ITEMS` makes the next create return a safe "try later" `messageKey`.
- Abuse: exceeding `SHARE_CREATE_THROTTLE` / `SHARE_READ_THROTTLE` returns 429 via the envelope.
- `DELETE`: delete then read = not-found; delete of an unknown id = safe idempotent success.
- Log inspection: metadata only (outcomes, cache size, evictions) — no result content, no payloads, no image.

### UI / UX

Testing Library under Vitest in `apps/web`.

- Public share page: loading → active renders result cards, compact chips, optional detailed-traits accordion, uncertainty, disclaimer, and a live countdown; expired and not-found states render friendly copy + "Create your own result"; the image is never rendered; no `dangerouslySetInnerHTML`.
- Countdown: with fake timers, the displayed remaining time decrements each second and the page switches to expired at zero without showing a stale result; unmount clears the interval.
- Share modal: Web Share API path invoked when available; fallback shows copy-link + the seven platform buttons; each button's `href`/intent is correctly URL-encoded and contains only the UUID; share text is localized; candidate names are unchanged; keyboard operation, focus management, and ARIA verified.
- RTL logical spacing, dark mode, and 320–414px layout preserved; no forbidden wording in any rendered string.

### End-to-End

Playwright in `apps/web`, run via `npm run test:e2e`. Standard: `testing/e2e-testing-standard.md`. The AI provider is never called (sharing does not touch the pipeline); the result is seeded/mocked.

- Full journey: on the result screen, "Share result" → modal opens with a link → **open the link in a fresh browser context** → the public page shows the full result + a live countdown → advance to the expired state.
- Not-found: navigating to `/share/{random-uuid}` shows the not-found state with "Create your own result".
- 375px mobile viewport; RTL (Arabic) layout assertion on the share page; accessibility smoke (axe) on the page + modal; PWA smoke via `npm run test:pwa`.
- Known constraint: local browser/e2e environment limits (documented risk) — if a spec cannot run in this environment, the exact blocker and the deterministic fake-clock component substitute are recorded in `15-dev-validation-report.md`.

### Security

Automated suites: `npm run test:security` (plus the architecture/lint gates as tests).

- Ingest hardening: image/base64/`data:` content rejected; oversized payload rejected; unknown keys rejected; forbidden-wording/sensitive-topic filter runs before storage.
- Public surface: `shareId` is a crypto UUID; unknown/malformed UUID is safe; the page is `noindex/nofollow` with a generic safe OG (no result content, no image); read is rate-limited.
- Memory-safety: item cap + byte cap + TTL + sweeper prove the cache cannot grow unbounded (DoS control); capacity rejection is a safe error.
- Leakage checks: no result content, raw payloads, image data, stack traces, or provider errors in logs or client errors; all failures are `AppError` + `messageKey`.
- Output safety: the page escapes all text; no `dangerouslySetInnerHTML`; only the UUID appears in share URLs (no result content leaks into links).
- Static gates as tests: raw cache client only inside the adapter; no `process.env` outside config; no cross-module internal import; no TS `enum`; no `any`; no inline definitions; thin controller (ESLint architecture plugin — lint must be 0/0).

### Regression

- Result screen still renders and the existing `useShareResult` clipboard path still works; the app compiles against the reused `FinalGameResultSchema` unchanged.
- Adjacent frontend flows: upload/consent, processing, result view, theme (dark/light), i18n static strings, PWA install smoke.
- Touched-module coverage gate: 95 lines / 90 branches / 95 functions / 95 statements via `npm run test:coverage`; plus `npm run quality:dead-code` (knip), `npm run quality:circular` (madge), `npm run security:scan` (trivy).

### Rollback

No DB and no migrations exist — the feature is stateless. Rollback is `git revert` of the feature commits + redeploy, validated by the release smoke test (`runbooks/release-smoke-test.md`).

- Triggers: any forbidden wording or image content reaching a shared page; a record surviving past TTL; unbounded cache growth; a public-page flaw; a gate found red post-hoc.
- The routes are additive, so a revert removes them cleanly; web and api ship together; a redeploy also clears the in-memory cache, so no records survive the rollback.
- Post-rollback checks: the result screen's clipboard share works; the `share-results` routes are gone; lint/typecheck/test suites green on the reverted tree; logs clean.

## Environment and Data Needs

- Test environments needed (local dev, `docker compose up --build`): local node workspaces for unit/integration/UI; docker compose for the release smoke; no staging infra required (stateless app, no DB, no Redis).
- Fixture data needed: a valid `FinalGameResult` fixture (reuse existing result fixtures, e.g. `packages/shared/tests/fixtures/`); variants for a forbidden-wording payload, an image/base64/`data:`-bearing payload (to prove rejection), and an oversized payload; a set of `shareId` UUIDs (valid + malformed). No real people's photos, and no image is ever part of a share fixture.
- External dependency stubs needed: none new — sharing does not call the AI provider; the cache is in-memory; the clock is faked in TTL/countdown tests.
- Monitoring evidence needed: logs inspected after integration/e2e runs proving metadata-only logging (no result content, no payloads, no image) and correct cache-size/eviction counters.

## Linked Test Case Files

- `test-cases/unit/` — share schemas + UUID, cache TTL/caps/cleanup, expiry helpers, image rejection, url builder, countdown hook, share-target encoding
- `test-cases/integration/` — create/read/delete endpoints (happy/expired/unknown/capacity/oversized/429), config fail-fast
- `test-cases/e2e/` — create→open-in-fresh-context→countdown→expired, not-found, mobile 375px, RTL, a11y smoke
- `test-cases/security/` — image/base64 rejection, unbounded-growth prevention, UUID/noindex/OG, leakage checks, output escaping
- `test-cases/business/` — real-result share, recipient view, share-target correctness, disclaimer wording (UAT by Ihab)

## Exit Checklist

- [x] Requirements mapped to tests (matrix above covers all `03` acceptance criteria)
- [x] Negative and edge cases included (invalid/oversized/forbidden/image payload, capacity, unknown/malformed/expired UUID, rate limit, countdown-at-zero, unmount cleanup, delete idempotency)
- [x] Security and permissions covered (no auth by design; public-by-link, ingest hardening, memory bounds, rate limits, leakage, escaping)
- [x] Migration and rollback covered when applicable (no migrations — revert + smoke test; redeploy clears cache)
- [x] Test-case locations identified

## Sign-Off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| QA lead | Ihab (acting QA — solo maintainer) | approve | 2026-07-08 |
| Technical owner | Ihab | approve | 2026-07-08 |

## Evidence And References To Attach

- Command evidence to be captured in `docs/features/temporary-shareable-results/15-dev-validation-report.md` (`npm run lint` · `npm run typecheck` · `npm run test:unit` · `npm run test:integration` · `npm run test:e2e` · `npm run test:coverage` · `npm run test:pwa` · `npm run build` · `npm run validate` · `npm run quality:dead-code` · `npm run quality:circular` · `npm run security:scan`)
- Reused contract + fixtures: `packages/shared/src/schemas/game-result.schema.ts`, `packages/shared/tests/fixtures/`; safety canon `packages/shared/src/constants/safety.constants.ts`; runbook `runbooks/release-smoke-test.md`
- Coverage gate reference: `docs/features/temporary-shareable-results/12-coverage-plan.md`

## Phase Blockers

Do not close this phase if:

- only happy paths are covered — not the case: image/oversized/forbidden/capacity/expired/malformed/429 and countdown-at-zero paths are all mapped
- requirements are not mapped to test layers — the matrix above maps every requirement/risk
- security, consent, or rollback tests are omitted without explanation — all present (no consent surface is touched; ingest hardening, public-surface, memory-bound, and rollback tests are defined); no waivers needed
- the team still cannot say what evidence will prove the change works — evidence plan defined (command outputs, endpoint assertions, fake-clock behavior, log inspection, e2e fresh-context journey)

No blockers remain. Phase closed by Ihab on 2026-07-08.
