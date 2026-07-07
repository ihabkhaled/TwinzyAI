# 11 - Test Strategy

- **Request ID:** TWZ-V2-001
- **Feature:** advanced-global-traits-v2
- **Date:** 2026-07-07
- **Owner:** Ihab (product + engineering)
- **Track:** standard — safety-critical surfaces touched (prompts, schemas, safety filter)

## Purpose

Design quality before implementation starts: define the test layers, negative/edge cases, environments, and evidence that will prove the V2 pipeline (221-field trait extraction, global top-5 candidates, strict judge, translate-result endpoint, languageCode flow) is correct, safe, and reversible.

## Step-by-Step Workflow

1. Mapped every acceptance criterion and risk from the V2 spec (`D:\Freelance\TwinzyV2.md` §17/§19) and `09-impact-analysis.md` to test layers below.
2. Defined happy paths (EN/AR analyze, translate), unhappy paths (invalid/oversized/mixed-language model JSON, unsafe wording, translation mutating scores), edge cases (fewer-than-5 results, "unclear" fields, invalid languageCode), and rollback validation.
3. Identified new test-case records for `test-cases/` (see Linked Test Case Files).
4. Tests are written **first** per slice (repo policy); evidence lands in `15-dev-validation-report.md`.

## Requirement-to-Test Matrix

| Requirement or risk | Unit | Integration | E2E | Security | Business / UAT |
| --- | --- | --- | --- | --- | --- |
| Prompt 1 schema: 221 fields / 16 nested categories, `traitCount`, `compactTraitSummary` (20–35), `uncertaintyNotes` (4 bounded arrays), `safetyCheck` all-false, bounded strings/arrays | ✔ strict Zod schema specs (accept/reject) | ✔ analyze flow with FakeAiAdapter fixtures | ✔ mocked happy path | ✔ oversized/unbounded output rejected | ✔ trait richness reviewed by Ihab |
| `languageCode` (en\|ar) flows locale → multipart request → DTO → all prompts → all responses; invalid code normalized to default | ✔ normalization helper, DTO schema | ✔ analyze accepts/normalizes languageCode; prompt payload spies | ✔ AR RTL flow | ✔ fake/garbage languageCode is inert | ✔ Arabic output quality check |
| Prompt 2: up to 5 global candidates, conservative scoring (90+ rare), aligned/mismatch arrays, localized reasons | ✔ candidate schema bounds (max 5, score 0–100) | ✔ candidate service caps >5, text-only input | — | ✔ exact-lookalike/biometric wording rejected | ✔ candidate plausibility spot-check |
| Prompt 3 judge: rescores, penalizes overconfidence/unclear images, removes unsafe/weak, `MAX_FINAL_RESULTS` 4→5, mandatory localized disclaimer + fallback | ✔ judge/aggregation policy specs | ✔ end-to-end analyze returns ≤5 with disclaimer; `removedCandidates` shape | ✔ fewer-than-5 fallback renders | ✔ unsafe candidate removal proven | ✔ verdict/wording review |
| NEW `POST /api/v1/game/translate-result`: text-only, no re-analysis, names/scores/ranks preserved by server-side overwrite, disclaimer/fallback server-enforced localized constants, rate-limited | ✔ overwrite guard + translation schemas | ✔ endpoint happy path; asserts trait-extraction/candidate/judge services NOT called; overwrite proven even when model mutates scores | ✔ locale switch after result | ✔ rejects image/multipart, oversized JSON, 429 on rate limit | ✔ translated result reads naturally |
| Image privacy: memory-only, wiped in `finally` on success AND on Prompt 1/2/3 failure; only trait extraction sees the image | ✔ buffer-wipe specs per failure path | ✔ adapter spies: candidate/judge/translation payloads contain no image/base64/buffer | ✔ network assertion: no re-upload on locale switch | ✔ no image in logs/response/storage | — |
| Model returns invalid/oversized/mixed-language JSON → bounded strict schemas + model fallback chain + `AiResponseInvalid` messageKey error | ✔ parse/validation error mapping | ✔ FakeAiAdapter invalid-JSON and fallback-chain scenarios | ✔ error state renders localized | ✔ no provider internals leak to client | — |
| Forbidden-wording guard covers all new text fields (finalReason, judgeNotes, mismatchWarnings, uncertaintyNotes, reasons, fallback) | ✔ safety-filter specs per field | ✔ unsafe fixture sanitized/rejected end-to-end | — | ✔ `npm run test:ai` + security suite | ✔ no forbidden wording visible |
| Frontend result UI: compact summary chips, trait count, grouped accessible Accordion (aria-expanded/aria-controls/keyboard), image-quality & uncertainty section, top-5 cards (confidence/country/category/mismatch warnings), localized disclaimer | ✔ helpers/mappers | — | ✔ mocked EN + AR flows | — | ✔ visual/UX review by Ihab |
| Translate-on-locale-switch: loading state, failure keeps old result, no re-analyze | ✔ hook/service logic | ✔ gateway calls translate endpoint only | ✔ switch after result; failure path | ✔ no accidental re-analysis | ✔ UX acceptance |
| 221-field UI performance (accordion lazy rendering, no jank on low-end mobile) | ✔ lazy-render logic | — | ✔ 375px mobile flow timing sanity | — | ✔ manual low-end phone check |
| RTL / dark mode / mobile-first / a11y preserved | ✔ Accordion a11y component tests | — | ✔ AR RTL + a11y smoke + 375px viewport | — | ✔ exploratory pass |
| Rollback: `git revert` + redeploy, `promptVersion` 'advanced-global-traits-v2' versions the contract, no migrations | — | ✔ suites green on reverted tree (spot check) | ✔ release smoke test | — | ✔ Ihab confirms rollback drill |

## Test Layers

### Unit

Vitest, colocated `*.test.ts`, run via `npm run test:unit`. Standard: `testing/unit-testing-standard.md`.

- `packages/shared`: every new strict Zod schema (16 trait-category schemas, uncertainty notes, candidate, judge result, translation request/response, language-code schema) — accept valid EN/AR fixtures; reject missing categories, unknown keys, over-bound arrays (candidates >5, summary >35, uncertainty >40), over-length strings, out-of-range scores, non-false safetyCheck flags.
- `apps/api`: prompt builders (languageCode interpolation, text-only payloads), safety filter over all new fields, language normalization (invalid → default), judge/aggregation policies (cap 5, mandatory disclaimer, score bounds), translation server-side overwrite guard (names/scores/ranks/verdicts restored even if model mutates them), buffer-wipe-in-`finally` on all four failure paths, `AiResponseInvalid` mapping and model fallback chain.
- `apps/web`: game mappers/validation/display helpers for the V2 shape, translate-flow hook logic (loading, failure-keeps-old-result), Accordion primitive behavior.

### Integration / API

Vitest `*.integration.test.ts` (api-integration project), full Nest app via supertest, run via `npm run test:integration`. Standard: `testing/integration-testing-standard.md`.

- `POST .../analyze` multipart with consent + image + languageCode: 200 with V2 envelope (promptVersion, ≤5 results, disclaimer); invalid languageCode normalized; consent/oversize/bad-MIME regressions unchanged.
- Adapter spies prove: image reaches ONLY trait extraction; candidate/judge payloads are traits/candidates JSON text only.
- FakeAiAdapter scenario fixtures: valid EN, valid AR, invalid JSON (→ `AiResponseInvalid` messageKey, no provider leak), unsafe wording (sanitized/rejected), oversized arrays (rejected), fallback model chain exercised.
- `POST /api/v1/game/translate-result`: happy path AR→EN and EN→AR; proves trait-extraction, candidate, and judge services are never invoked; server overwrite preserves names/scores/ranks; rejects image/multipart content type, unknown keys, oversized body; returns 429 when rate limit exceeded.

### UI / UX

Testing Library under Vitest in `apps/web`.

- New `ui-primitives` Accordion: aria-expanded/aria-controls wiring, keyboard support (Enter/Space toggle, arrow/Home/End focus movement), focus-visible states, reduced-motion friendliness.
- Result view: compact summary chips + trait count render; 16 grouped categories render lazily inside accordion; localized "unclear" values render; image-quality & uncertainty section; top-5 cards show confidence, countryOrRegion, publicCategory, mismatch warnings; localized disclaimer always present; fewer-than-5 fallback message.
- Locale switch: translate loading state shown; on failure the previous result stays visible with a localized error; names/scores unchanged after translation; RTL logical spacing; no forbidden wording in any rendered string; no image in localStorage/sessionStorage/IndexedDB; object URL revoked.

### End-to-End

Playwright in `apps/web`, run via `npm run test:e2e`. Standard: `testing/e2e-testing-standard.md`. Gemini mocked at the network/adapter boundary — no live AI calls.

- Full EN happy path: upload → consent → analyze → compact summary → accordion → top-5 → disclaimer.
- Full AR happy path on the Arabic route (RTL layout assertions).
- Language switch after result: asserts a translate request fires and **no** multipart analyze re-POST occurs (image not re-uploaded/re-analyzed).
- Invalid image rejected; invalid model JSON handled with localized error; fewer-than-5 fallback; 375px mobile viewport flow; accessibility smoke (axe) on the result page; PWA smoke via `npm run test:pwa`.
- Known constraint: local browser/e2e environment limits (documented risk) — if a spec cannot run in this environment, the exact blocker and manual substitute procedure are recorded in `15-dev-validation-report.md`.

### Security

Automated suites: `npm run test:security`, `npm run test:file-security`, plus `npm run test:ai` for prompt-safety scenarios.

- Upload chain regression: consent-first, single file, size/MIME/extension/consistency/magic-bytes/decode, ClamAV fail-closed posture unchanged.
- Forbidden-wording guard proven across every new output field (Prompt 1 notes, Prompt 2 reasons, Prompt 3 finalReason/judgeNotes/mismatchWarnings, translation output).
- Translation endpoint abuse: image/file payload rejected, oversized JSON rejected, unknown keys rejected, rate limit enforced, prompt-injection strings inside trait/candidate text treated as inert data.
- Leakage checks: no image bytes, raw prompts, or raw Gemini responses in logs or client errors; all failures are AppError + messageKey; `GEMINI_MODEL` read from `.env` only.
- Static gates as tests: no `@google/genai` import outside the adapter, no `process.env` outside config/bootstrap, no TS `enum`, no inline schema definitions (ESLint architecture plugin — lint must be 0/0).

### Regression

- Existing analyze flow behavior that V2 replaces (15 flat traits → V2 shape): all previously green api unit/integration suites adapted, never deleted; error envelope, health endpoint, rate limiting, 413/400 paths re-run.
- Frontend adjacent flows: upload/consent form, processing card, error states, theme (dark/light), i18n static strings, PWA install smoke.
- Touched-module coverage gate: 95 lines / 90 branches / 95 functions / 95 statements via `npm run test:coverage`; plus `npm run quality:dead-code` (knip), `npm run quality:circular` (madge), `npm run security:scan` (trivy).

### Rollback

No DB and no migrations exist — the pipeline is stateless. Rollback is `git revert` of the feature commits + redeploy, validated by the release smoke test (`runbooks/release-smoke-test.md`).

- Triggers: sustained `AiResponseInvalid` rate, safety-filter rejections spiking, translate endpoint abuse, or broken result UI on production smoke.
- The API contract is versioned by `promptVersion: 'advanced-global-traits-v2'`, so a revert cleanly restores the prior contract; web and api ship together, so the revert is atomic with no data compatibility concerns.
- Post-rollback checks: analyze happy path smoke, health endpoint, absence of V2-only fields in responses, lint/typecheck/test suites green on the reverted tree.

## Environment and Data Needs

- Test environments needed (local dev, `docker compose up --build`): local node workspaces for unit/integration/UI; docker compose for release smoke; no staging infra required (stateless app).
- Fixture data needed (synthetic image fixtures — see `apps/api/src/tests/fixtures/` and `testing/test-data-and-fixtures.md`; never real people's photos): existing synthetic images reused; NEW JSON fixtures for FakeAiAdapter — valid EN advanced traits (221 fields), valid AR, low-quality/many-"unclear" variant, invalid JSON, unsafe-wording, oversized-array, mixed-language, and translation request/response pairs (mutated-score variant to prove overwrite).
- External dependency stubs needed (the AI provider adapter is always stubbed in unit/integration tests — no live Gemini calls in CI): FakeAiAdapter extended with per-prompt scenario control (Prompt 1–4) and model-fallback-chain simulation; ClamAV stubbed/disabled locally.
- Monitoring evidence needed (structured log entries, request-id correlation): logs inspected after integration/e2e runs proving metadata-only logging (no image, no raw prompt/response), request-id correlation across the 3-prompt pipeline and translate calls.

## Linked Test Case Files

- `test-cases/unit/` — V2 schema bounds, safety filter fields, translation overwrite guard, buffer wipe paths
- `test-cases/integration/` — analyze-with-languageCode, text-only prompt payloads, translate-result endpoint (happy/abuse/429)
- `test-cases/e2e/` — EN/AR happy paths, locale-switch-no-reanalyze, fallback, mobile 375px, a11y smoke
- `test-cases/security/` — forbidden wording per field, translation-endpoint abuse, leakage checks, upload-chain regression
- `test-cases/business/` — trait richness, Arabic localization quality, candidate plausibility, disclaimer wording (UAT by Ihab)

## Exit Checklist

- [x] Requirements mapped to tests (matrix above covers all §19 acceptance criteria)
- [x] Negative and edge cases included (invalid/oversized/mixed-language JSON, unsafe wording, fewer-than-5, invalid languageCode, translation mutation)
- [x] Security and permissions covered (no auth exists by design; consent, abuse, leakage, and rate-limit cases defined)
- [x] Migration and rollback covered when applicable (no migrations — revert + smoke test defined)
- [x] Test-case locations identified

## Sign-Off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| QA lead | Ihab (acting QA — solo maintainer) | approve | 2026-07-07 |
| Technical owner | Ihab | approve | 2026-07-07 |

## Evidence And References To Attach

- Spec source: `D:\Freelance\TwinzyV2.md` §17 (test requirements), §19 (acceptance criteria)
- Command evidence to be captured in `docs/features/advanced-global-traits-v2/15-dev-validation-report.md` (`npm run lint` · `npm run typecheck` · `npm run test:unit` · `npm run test:integration` · `npm run test:e2e` · `npm run test:coverage` · `npm run test:ai` · `npm run test:security` · `npm run test:file-security` · `npm run build` · `npm run quality:dead-code` · `npm run quality:circular` · `npm run security:scan`)
- FakeAiAdapter fixture notes: `testing/test-data-and-fixtures.md`; runbook: `runbooks/release-smoke-test.md`
- Coverage gate reference: `docs/features/advanced-global-traits-v2/12-coverage-plan.md`

## Phase Blockers

Do not close this phase if:

- only happy paths are covered — not the case: invalid JSON, unsafe wording, oversized payloads, translation mutation, and fallback paths are all mapped
- requirements are not mapped to test layers — matrix above maps every requirement/risk
- security, consent, or rollback tests are omitted without explanation — all present; no waivers needed
- the team still cannot say what evidence will prove the change works — evidence plan defined (command outputs, adapter spies, network assertions, log inspection)

No blockers remain. Phase closed by Ihab on 2026-07-07.
