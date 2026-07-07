# 12 - Coverage Plan

- **Request ID:** TWZ-V2-001 — `advanced-global-traits-v2`
- **Date:** 2026-07-07
- **Owner / approver:** Ihab
- **Track:** standard (major feature; safety-critical surfaces touched: prompts, schemas, safety filter, translation endpoint)

## Purpose

Define the measurable coverage gate for the modules touched by the V2 upgrade (221-field trait extraction, global 5-result candidate/judge pipeline, `languageCode` flow, new `POST /api/v1/game/translate-result` endpoint) and guard against coverage theater on its safety-critical paths.

## Policy

- Enforced gate: `npm run test:coverage` — statements ≥ 95%, branches ≥ 90%, functions ≥ 95%, lines ≥ 95% (Vitest v8 provider fails the run below threshold; enforced at pre-push and re-run in CI)
- Touched modules aim higher than the floor; the safety-critical paths of this feature (image-isolation, buffer wipe, forbidden-wording filtering, translation overwrite guarantees) must be near-100% with branch-level scenarios
- Global repository average is not an acceptable substitute for weak touched-module coverage — the per-file table is the review evidence
- The 90% branch floor exists only to absorb the synthetic decorator-downlevel branch per `@Injectable`/`@Catch` class line; every real branch in changed code must be covered
- Full policy and waiver process: `testing/coverage-policy.md`

## Touched Module Coverage Targets

All rows sit inside the gated allowlist (`application/`, `infrastructure/`, `lib/`, `packages/shared/src/utils`) unless noted below the table.

| Module / area | Statements | Branches | Functions | Lines | Notes |
| --- | --- | --- | --- | --- | --- |
| `apps/api/src/modules/ai/application/trait-extraction.service.ts` | ≥ 95% | ≥ 90% | ≥ 95% | ≥ 95% | Prompt 1: only stage that sees the image; 221-field strict parse, `languageCode` pass-through, safety filter. Target near 100% — privacy-critical |
| `apps/api/src/modules/ai/application/candidate-generation.service.ts` | ≥ 95% | ≥ 90% | ≥ 95% | ≥ 95% | Prompt 2: text-only input guarantee, ≤ 5 candidates cap, conservative-score bounds |
| `apps/api/src/modules/ai/application/candidate-judge.service.ts` | ≥ 95% | ≥ 90% | ≥ 95% | ≥ 95% | Prompt 3: rescoring, unsafe/weak removal, `removedCandidates`, ≤ 5 finals, mandatory disclaimer |
| `apps/api/src/modules/ai/application/` translation service (new, Prompt 4) | ≥ 95% | ≥ 90% | ≥ 95% | ≥ 95% | Text-only translation; server-side overwrite of names/scores/ranks/verdicts + server-enforced localized disclaimer/fallback. Target near 100% |
| `apps/api/src/modules/ai/application/ai-safety.service.ts` | ≥ 95% | ≥ 90% | ≥ 95% | ≥ 95% | Forbidden-wording guard extended over all new localized fields (finalReason, judgeNotes, mismatchWarnings, removedCandidates reasons, uncertaintyNotes, disclaimer, fallback). Target near 100% |
| `apps/api/src/modules/ai/lib/**` (json-response.util, ai-response-sanitizer, forbidden-wording.guard, provider-error.util) | ≥ 95% | ≥ 90% | ≥ 95% | ≥ 95% | Parse/sanitize branches for non-JSON, oversized, mixed-language, unsafe model output → `AiResponseInvalid` |
| `apps/api/src/modules/ai/infrastructure/prompt-template.repository.ts` | ≥ 95% | ≥ 90% | ≥ 95% | ≥ 95% | 4th prompt resource + `advanced-global-traits-v2` promptVersion resolution |
| `apps/api/src/modules/game/application/analyze-game.use-case.ts` + `analyze-game-stream.use-case.ts` | ≥ 95% | ≥ 90% | ≥ 95% | ≥ 95% | `languageCode` DTO wiring (invalid → default normalization); buffer wiped in `finally` on success and on Prompt 1/2/3 failure — wipe branches near 100% |
| `apps/api/src/modules/game/application/` translate-result use case (new) | ≥ 95% | ≥ 90% | ≥ 95% | ≥ 95% | Orchestration proves no call into trait extraction / candidate generation / judge; rejects image payloads and oversized JSON; rate-limit wiring |
| `apps/api/src/modules/game/lib/**` (touched helpers: consent, game-stream) | ≥ 95% | ≥ 90% | ≥ 95% | ≥ 95% | Only files actually changed by this feature are gated rows |
| `apps/api/src/modules/result-aggregation/application/result-aggregation.service.ts` + `lib/**` | ≥ 95% | ≥ 90% | ≥ 95% | ≥ 95% | `MAX_FINAL_RESULTS` 4 → 5, score bounds, no-forbidden-wording re-check, mandatory disclaimer, localized fallback when fewer than 5 |
| `packages/shared/src/utils/**` (any touched helpers, e.g. language normalization) | ≥ 95% | ≥ 90% | ≥ 95% | ≥ 95% | Pure cross-side utilities remain in the gated denominator |

Outside the gated denominator but still validated (per `testing/coverage-policy.md` §2 — these are scope definitions, not new waivers):

- `packages/shared/src/schemas/**` (advanced trait schema with 16 nested categories, candidate/judge/translation/language-code schemas) and DTOs — schema declarations; behavior proven by dedicated contract/schema tests (bounds: candidates ≤ 5, results ≤ 5, compactTraitSummary 20–35, uncertaintyNotes arrays bounded, max string lengths, `.strict()` unknown-key rejection)
- `apps/api/src/modules/ai/adapters/gemini.adapter.ts` — exercised through integration stubs (timeout, 5xx, model fallback chain, `GEMINI_MODEL` from env)
- `apps/api/src/modules/game/api/game.controller.ts` + new translate route — thin controllers proven by integration tests (400/413/415/422/429 paths)
- `apps/web/src/modules/game/**`, new ui-primitives Accordion, translate-on-locale-switch hook — under the standing web waiver (below); validated by web-unit tests + Playwright e2e + accessibility checks, not the numeric gate

## Critical Scenario Areas

Near-100%, scenario-rich coverage required (a failure here is a privacy or safety incident):

- **Image isolation:** image reaches only Prompt 1; candidate, judge, and translation calls receive text/JSON only — asserted on the adapter boundary for every pipeline path
- **Buffer wipe:** image buffer zero-filled in `finally` on success and on each failure stage (Prompt 1, Prompt 2, Prompt 3, aggregation); no image logging, storage, or echo in any response
- **Strict schema validation:** 221-field nested trait schema (16 categories + uncertaintyNotes + compactTraitSummary + traitCount + safetyCheck) rejects missing categories, unbounded arrays, over-long strings, unknown keys, and wrong promptVersion
- **Safety filtering:** forbidden-wording guard (face recognition / biometric / identity / exact-lookalike / sensitive-inference wording) rejects or sanitizes across every new localized field in all three pipeline outputs plus translation output
- **`languageCode` flow:** valid `en`/`ar` accepted, invalid values normalized to the default (never a 500), value propagated to all prompts and echoed in responses
- **Result caps and bounds:** aggregation enforces ≤ 5 final results, score bounds, mandatory localized disclaimer, localized fallback when fewer than 5 safe results; never forces weak candidates in
- **Translation overwrite guarantees:** server-side overwrite proves names, scores, ranks, verdicts, and shouldDisplay flags are byte-identical after translation even when the model mutates them; disclaimer/fallback replaced with server-enforced localized constants
- **Translation endpoint hardening:** rejects image/file payloads, oversized JSON, unknown keys; is rate-limited; never invokes Prompts 1–3; failure returns a typed `messageKey` error
- **Gemini failure modes:** timeout, provider 5xx, non-JSON, oversized, and mixed-language responses map to `AiResponseInvalid`/AppError with messageKey; model fallback chain exercised; no provider internals leak to the client
- **Frontend behavior (tested, not threshold-gated):** locale switch calls translation only (no re-upload/re-analyze), failure keeps the previous result visible, accordion keyboard/aria behavior, no forbidden wording rendered, no image persisted in any storage, object URL revoked

## Coverage Evidence Plan

- Tooling used: Vitest 4 + `@vitest/coverage-v8` via `npm run test:coverage` (chains `build:shared` first — never bypass with bare `npx vitest`)
- Report location: `coverage/` (`text` per-file table for review, `lcov` for the PR view)
- How touched modules will be identified: git diff of the TWZ-V2-001 feature commits against `main`, mapped to the gated-allowlist rows above
- How branch gaps will be reviewed: per-file coverage table read for every touched module before done is claimed; focused runs (`npm run test:ai`, `npm run test:file-security`, `npm run test:security`) used to iterate cheaply; any uncovered branch in the critical scenario areas blocks completion
- Supporting gates run alongside coverage: `npm run lint` (0/0), `npm run typecheck`, `npm run build`, knip dead-code, madge circular, trivy scan
- Enforcement point: Husky pre-push (`test:coverage` + `build`) and the identical CI command; no `--no-verify`

## Waiver Section

| Field | Value |
| --- | --- |
| Waiver needed | No new waiver for this feature. The one standing waiver applies: `apps/web/src/**` is outside the gated coverage denominator until the web workstream adopts the gate (recorded in `testing/coverage-policy.md` §6 and `memory/testing-strategy.md`). |
| Reason | Web threshold gating is a pre-existing workspace-level scope decision, not a TWZ-V2-001 exception. All new API and shared logic in this feature is fully inside the gated scope and cannot cite the web waiver. |
| Compensating controls | Frontend V2 behavior (translate-on-switch, accordion a11y, no-image-persistence, forbidden-wording absence, RTL/dark/mobile) covered by web-unit tests, Playwright e2e with mocked Gemini (en + ar happy paths, language switch, failure paths), and accessibility smoke. |
| Approver | Ihab (standing waiver owner: web workstream) |
| Expiration date | When the web workstream turns on the numeric gate; no per-feature expiry needed for TWZ-V2-001. |

## Exit Checklist

- [x] Coverage thresholds defined (95/90/95/95 on the gated scope; near-100% on critical scenario areas)
- [x] Touched modules listed (12 gated rows + explicitly-tested non-denominator surfaces)
- [x] Critical scenario areas called out (image isolation, buffer wipe, schema bounds, safety filter, translation overwrite, caps, failure modes)
- [x] Waiver status documented (no new waiver; standing `apps/web` waiver referenced with compensating controls)

## Evidence And References To Attach

- Coverage command: `npm run test:coverage` (root vitest.config.ts thresholds; same entrypoint locally and in CI)
- Report location: `coverage/` — attach the per-file text table for touched modules to `15-dev-validation-report.md`
- Touched-module identification: `git diff main...` file list for the TWZ-V2-001 slices
- Focused-run commands: `npm run test:ai`, `npm run test:file-security`, `npm run test:security`
- Waiver reference: `testing/coverage-policy.md` §6 + `memory/testing-strategy.md` (standing web waiver)
- Rollback note: feature is stateless (no DB, no migrations); reverting the TWZ-V2-001 commits restores the prior gate state — coverage plan carries no data-rollback coverage obligations

## Phase Blockers

Do not close this phase if:

- coverage is described only as a repo-wide average
- critical scenario areas are not explicitly called out
- a waiver is needed but has no approver or expiration date
