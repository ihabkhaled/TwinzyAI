# 12 - Coverage Plan

- **Request ID:** TWZ-SHARE-001 — `temporary-shareable-results`
- **Date:** 2026-07-08
- **Owner / approver:** Ihab
- **Track:** standard (new public surface + in-memory payload caching; no AI-pipeline change)

## Purpose

Define the measurable coverage gate for the modules touched by the share feature (the `ShareResultCachePort` + bounded in-memory TTL adapter, the create/read/delete use-cases, the validation/safety service, the `lib` helpers, and the config additions) and guard against coverage theater on its safety-critical and memory-safety paths.

## Policy

- Enforced gate: `npm run test:coverage` — statements ≥ 95%, branches ≥ 90%, functions ≥ 95%, lines ≥ 95% (Vitest v8 provider fails the run below threshold; enforced at pre-push and re-run in CI)
- Touched modules aim higher than the floor; the safety- and memory-critical paths of this feature (image rejection, safety re-filter, TTL/eviction/caps, `OnModuleDestroy` cleanup, expiry math) must be near-100% with branch-level scenarios
- Global repository average is not an acceptable substitute for weak touched-module coverage — the per-file table is the review evidence
- The 90% branch floor exists only to absorb the synthetic decorator-downlevel branch per `@Injectable`/`@Catch` class line; every real branch in changed code must be covered
- Full policy and waiver process: `testing/coverage-policy.md`

## Touched Module Coverage Targets

All rows sit inside the gated allowlist (`application/`, `infrastructure/`, `lib/`, `config/`, `packages/shared/src/utils`) unless noted below the table.

| Module / area | Statements | Branches | Functions | Lines | Notes |
| --- | --- | --- | --- | --- | --- |
| `apps/api/src/modules/share-results/infrastructure/` in-memory TTL cache adapter | ≥ 95% | ≥ 90% | ≥ 95% | ≥ 95% | Lazy expiry on read, periodic sweeper, `OnModuleDestroy` cleanup, item-cap + byte-cap rejection, delete idempotency. Target near 100% — memory-safety critical |
| `apps/api/src/modules/share-results/application/` create use-case | ≥ 95% | ≥ 90% | ≥ 95% | ≥ 95% | Validate `FinalGameResult` → re-safety-filter → reject image/base64/`data:` → byte cap → mint UUID → `expiresAt` → store → build `shareUrl`. Target near 100% — safety-critical |
| `apps/api/src/modules/share-results/application/` read use-case | ≥ 95% | ≥ 90% | ≥ 95% | ≥ 95% | UUID validation, lazy-expiry read, safe not-found/expired mapping; expired never returned |
| `apps/api/src/modules/share-results/application/` delete use-case | ≥ 95% | ≥ 90% | ≥ 95% | ≥ 95% | Idempotent delete; unknown id = safe no-op |
| `apps/api/src/modules/share-results/application/` validation/safety service | ≥ 95% | ≥ 90% | ≥ 95% | ≥ 95% | Forbidden-wording/sensitive-topic re-filter + image/base64/`data:` rejection over the payload. Target near 100% |
| `apps/api/src/modules/share-results/lib/**` (share-id, expiry math, share-url builder) | ≥ 95% | ≥ 90% | ≥ 95% | ≥ 95% | `crypto.randomUUID`, `computeExpiresAt`/`remainingSeconds`/`isExpired`, url from base URL — pure helpers, near 100% |
| `apps/api/src/config/**` (touched: env schema + bounds + accessors for the five share vars) | ≥ 95% | ≥ 90% | ≥ 95% | ≥ 95% | Accept valid values + defaults; reject out-of-bounds TTL/caps (fail-fast); typed accessors |
| `packages/shared/src/utils/**` (any touched helpers, e.g. share-url/UUID utilities if placed here) | ≥ 95% | ≥ 90% | ≥ 95% | ≥ 95% | Pure cross-side utilities remain in the gated denominator |

Outside the gated denominator but still validated (per `testing/coverage-policy.md` §2 — scope definitions, not new waivers):

- `packages/shared/src/schemas/**` (share `shareId` UUID schema, create/read response schemas) — schema declarations; behavior proven by dedicated contract/schema tests (UUID accept/reject, `.strict()` unknown-key rejection, reuse of `FinalGameResultSchema` as the create request)
- `apps/api/src/modules/share-results/api/` thin controller + DTOs — proven by integration tests (200/400/404/413/429 paths, one delegation per endpoint)
- `apps/api/src/modules/share-results/model/` port interface + DI token + record type — type/interface declarations, exercised through the adapter and use-case tests
- `apps/web/src/modules/game/**` share code (public-page container, countdown hook, share modal, share-target helpers) and `apps/web/src/app/share/[shareId]/page.tsx` — under the standing web waiver (below); validated by web-unit/component tests + Playwright e2e + accessibility checks, not the numeric gate

## Critical Scenario Areas

Near-100%, scenario-rich coverage required (a failure here is a privacy, safety, or availability incident):

- **No image, ever:** the create path rejects any image/base64/`data:` content; the stored record, the read response, and the rendered page contain no image field — asserted at ingest, in the adapter, and on the page
- **Safety re-filter on ingest:** the forbidden-wording/sensitive-topic filter runs over the payload before storage; forbidden content is rejected; the page renders only validated, escaped text
- **Memory bounds (DoS control):** item cap and byte cap reject creates at capacity with a safe error; TTL lazy expiry + the sweeper reclaim expired entries; `OnModuleDestroy` clears the map and the timer — the cache can never grow unbounded or leak a handle
- **TTL correctness:** an expired record is never returned by `get`; `computeExpiresAt`/`remainingSeconds`/`isExpired` are exact at boundaries (just-before / at / just-after expiry) under a controlled clock
- **UUID + public-surface hardening:** `shareId` is a crypto UUID; malformed/unknown UUID reads are safe not-found; the page is `noindex/nofollow` with a generic safe OG; read is rate-limited
- **Error mapping:** every rejection path (invalid/oversized/forbidden/image/capacity/unknown/expired/429) maps to `AppError` + `messageKey` — never a stack trace, provider error, or 500 leak
- **Config fail-fast:** out-of-bounds TTL/caps crash startup with a readable message rather than failing a request later
- **Frontend behavior (tested, not threshold-gated):** countdown ticks and reaches zero, transitions to expired without a stale result, and cleans up on unmount; share-target URLs are correctly encoded and UUID-only; the image is never rendered; no `dangerouslySetInnerHTML`

## Coverage Evidence Plan

- Tooling used: Vitest 4 + `@vitest/coverage-v8` via `npm run test:coverage` (chains `build:shared` first — never bypass with a bare `npx vitest`)
- Report location: `coverage/` (`text` per-file table for review, `lcov` for the PR view)
- How touched modules will be identified: git diff of the TWZ-SHARE-001 feature commits against `main`, mapped to the gated-allowlist rows above
- How branch gaps will be reviewed: per-file coverage table read for every touched module before done is claimed; focused runs (`npm run test:security`, targeted `test:unit` files) used to iterate cheaply; any uncovered branch in the critical scenario areas blocks completion
- Supporting gates run alongside coverage: `npm run lint` (0/0), `npm run typecheck`, `npm run build`, `npm run test:pwa`, knip dead-code, madge circular, trivy scan
- Enforcement point: Husky pre-push (`test:coverage` + `build`) and the identical CI command; no `--no-verify`

## Waiver Section

| Field | Value |
| --- | --- |
| Waiver needed | No new waiver for this feature. The one standing waiver applies: `apps/web/src/**` is outside the gated coverage denominator until the web workstream adopts the gate (recorded in `testing/coverage-policy.md` §6 and `memory/testing-strategy.md`). |
| Reason | Web threshold gating is a pre-existing workspace-level scope decision, not a TWZ-SHARE-001 exception. All new API and shared logic in this feature (cache adapter, use-cases, safety service, `lib` helpers, config) is fully inside the gated scope and cannot cite the web waiver. |
| Compensating controls | Frontend share behavior (countdown, page states, modal targets, no-image render, escaping, RTL/dark/mobile) covered by web-unit/component tests, Playwright e2e (create→open-in-fresh-context→countdown→expired), and accessibility smoke. |
| Approver | Ihab (standing waiver owner: web workstream) |
| Expiration date | When the web workstream turns on the numeric gate; no per-feature expiry needed for TWZ-SHARE-001. |

## Exit Checklist

- [x] Coverage thresholds defined (95/90/95/95 on the gated scope; near-100% on critical scenario areas)
- [x] Touched modules listed (8 gated rows + explicitly-tested non-denominator surfaces)
- [x] Critical scenario areas called out (no-image, safety re-filter, memory bounds, TTL correctness, UUID/public-surface, error mapping, config fail-fast)
- [x] Waiver status documented (no new waiver; standing `apps/web` waiver referenced with compensating controls)

## Evidence And References To Attach

- Coverage command: `npm run test:coverage` (root vitest.config.ts thresholds; same entrypoint locally and in CI)
- Report location: `coverage/` — attach the per-file text table for touched modules to `15-dev-validation-report.md`
- Touched-module identification: `git diff main...` file list for the TWZ-SHARE-001 slices
- Focused-run commands: `npm run test:security`, targeted `npm run test:unit` files for the cache adapter and use-cases
- Waiver reference: `testing/coverage-policy.md` §6 + `memory/testing-strategy.md` (standing web waiver)
- Rollback note: feature is stateless (no DB, no migrations); reverting the TWZ-SHARE-001 commits restores the prior gate state — the coverage plan carries no data-rollback coverage obligations

## Phase Blockers

Do not close this phase if:

- coverage is described only as a repo-wide average — not the case: per-file gated rows above
- critical scenario areas are not explicitly called out — called out (no-image, safety re-filter, memory bounds, TTL correctness, UUID/public-surface, error mapping, config fail-fast)
- a waiver is needed but has no approver or expiration date — no new waiver; the standing web waiver has an owner (Ihab) and a defined lift condition
