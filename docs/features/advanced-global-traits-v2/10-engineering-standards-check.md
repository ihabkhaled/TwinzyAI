# 10 - Engineering Standards Check

- Request ID: TWZ-V2-001
- Feature: advanced-global-traits-v2
- Date: 2026-07-07
- Owner / approver: Ihab
- Track: standard (major feature; safety-critical surfaces touched: prompts, schemas, translation endpoint)

## Purpose

Freeze the implementation rules before coding begins for the V2 upgrade: 221-field nested trait extraction (16 categories + uncertaintyNotes + compactTraitSummary), global 5-candidate generation, strict judge, the new text-only `POST /api/v1/game/translate-result` endpoint (Prompt 4), `languageCode` flowing end to end, MAX_FINAL_RESULTS 4 -> 5, and the frontend trait-accordion / top-5 / translate-on-locale-switch UI.

## Step-by-Step Workflow

1. Reviewed `rules/00-non-negotiable-rules.md`, then the touched topic rules: 01/16 (architecture), 05/10 (types-constants, library wrapping), 12 (i18n), 13 (a11y), 14 (AI safety), 15 (file-upload security), 18/21 (controllers, DTO validation), 22 (observability), 09 + `testing/` (tests/coverage), 24 (release gate), plus `docs/sdlc/engineering-standards.md` and `context/architecture-map.md`.
2. Request-specific rules identified and recorded below (translation-preservation, bounded model output, image-flow isolation, constant-driven result cap).
3. Compliance approach per standard area recorded in the matrix below.
4. One candidate permanent rule identified (translation-preservation via server-side overwrite); update path recorded in the Permanent Policy Update Check.

## Standards Review Matrix

| Standard area | Requirement | How this request will comply |
| --- | --- | --- |
| Architecture boundaries (`rules/01`, `rules/16`) | One-way layers; thin controllers; every external lib behind an adapter; prompts only via the prompt repository | New translate flow follows Controller -> use-case -> AI application service -> `gemini.adapter`; no direct `@google/genai` import outside the adapter (lint-enforced); prompt files read only through `prompt-template.repository`; existing game/ai modules extended in place — no parallel or duplicate modules; frontend keeps Component -> Hook -> Service -> Gateway, translate call goes through the game gateway |
| Naming and module structure (`rules/05`, `rules/10`) | Shared structure in `packages/shared`; no TS `enum`; no inline definitions; descriptive ownership-based filenames | All 16 trait-category schemas, candidate/judge/translation schemas, language-code schema, prompt-version / verdict / confidence / popularity / public-category constants live in `packages/shared` as Zod strict objects + `as const` objects with `*_VALUES` arrays and derived types; zero inline schemas/constants in services, controllers, hooks, or TSX; the Accordion becomes a shared ui-primitives component, not per-screen logic |
| Error handling (envelope, `rules/18`, `rules/21`) | Strict DTOs; AppError + messageKey; no provider errors to client; terminal states everywhere | Analyze DTO gains `languageCode` (normalized to default locale when invalid — never a 500); DTOs reject unknown keys; translation endpoint rejects image payloads and oversized JSON; invalid/oversized/mixed-language model JSON -> `AiResponseInvalid` messageKey after model fallback chain is exhausted; Gemini timeout -> messageKey error; every async flow reaches a terminal success/failure state |
| Logging and observability (`rules/22`) | Structured metadata-only logs; no sensitive leakage | Log promptVersion, languageCode, traitCount, candidate/result counts, durations, and model-fallback events only; never log image bytes/base64, raw prompts, or raw Gemini responses in production; redaction covers all new text fields |
| Accessibility (`rules/13`) | Keyboard, ARIA, contrast, reduced motion, no color-only status | New Accordion ships with `aria-expanded`/`aria-controls`, full keyboard support, and visible focus states; confidence/verdict/mismatch badges pair color with text; reduced-motion respected; screen-reader-friendly error and translation-loading announcements; validated at 320/375/390/414 widths |
| Localization / content (`rules/12`) | All user-facing text through i18n; RTL preserved | `languageCode` (en\|ar) flows: active next-intl locale -> multipart analyze request -> DTO -> all four prompts -> all responses; static UI strings only via next-intl keys; disclaimer and fallback are server-enforced localized constants; public-figure names keep common public spelling; locale switch triggers the translate flow with loading state, and failure keeps the previous result visible with a localized error key; RTL logical spacing and dark mode preserved |
| Secure coding (`rules/06`, `rules/15`) | Upload chain intact; rate limits; bounded input/output; no injection paths | Existing upload chain unchanged (consent flag, single file, size/MIME/extension/consistency, magic bytes, decode, ClamAV fail-closed in production); translate-result is text-only, Zod-strict, size-capped, and rate-limited via the existing throttler setup; all model output schemas bound arrays (candidates <= 5, results <= 5, compactTraitSummary <= 35, uncertaintyNotes arrays <= 40) and string lengths; model text treated as untrusted (prompt-injection content is schema-bounded then safety-filtered); no dynamic code paths from model output |
| Privacy / AI safety (`rules/14`) | Image memory-only; text-only downstream prompts; validated + safety-filtered output | Image lives in memory only and is zero-wiped in `finally` on every success/failure path; only Prompt 1 (trait extraction) receives the image — Prompts 2/3/4 receive traits/candidates/result JSON only; every AI response is Zod-validated and passed through the forbidden-wording guard (extended to finalReason, judgeNotes, mismatchWarnings, uncertaintyNotes, removedCandidates reasons, translated fields); safetyCheck flags must all be false; no identity/biometric/sensitive-inference/exact-lookalike wording can reach the client; translation preserves names/scores/ranks/verdicts by server-side overwrite from the canonical input result |
| Testing and coverage (`rules/09`, `testing/`) | Tests first; 95/90/95/95 on touched modules; scenario-rich negative coverage | Tests written before implementation: schema accept/reject suites (missing categories, unbounded arrays, over-long strings, forbidden wording), use-case tests proving image-flow isolation and wipe-in-finally on every prompt failure, translation-preservation tests (names/scores/ranks unchanged; no calls to extraction/candidates/judge), frontend tests for translate-on-switch / no re-analysis / failure-keeps-old-result / a11y, e2e happy paths in en and ar with mocked Gemini; coverage gate 95 lines / 90 branches / 95 functions / 95 statements on all touched modules |
| Documentation | Docs ship in the same delivery stream | README "How it works", `docs/architecture.md`, `docs/ai-safety.md`, `docs/privacy-and-data-retention.md`, `docs/env-vars.md` (confirm no new vars), `TEST_CASES.md`, `context/architecture-map.md`, `memory/ai-safety-decisions.md`, `memory/known-pitfalls.md`, and this feature's artifact set; stale "15 traits" / "max 4 results" wording removed everywhere |
| Release readiness (`rules/24`) | All gates green; rollback defined | `npm run lint` (0 errors / 0 warnings, no inline suppressions), typecheck (tsgo), `test:coverage`, `build`, knip dead-code, madge circular, trivy security scan; rollback = revert the feature commits — the contract is versioned by `promptVersion: 'advanced-global-traits-v2'` and the app is stateless with no DB, so no migrations or data rollback exist |

## Request-Specific Rules

- The image is passed exclusively to the trait-extraction call; candidate, judge, and translation prompts are text/JSON-only. Enforced in use-case wiring and proven by dedicated tests (including "translation endpoint never calls extraction/candidates/judge").
- Translation must never trust the model with identity or numeric fields: after Prompt 4 returns, the server overwrites names, scores, ranks, and verdict values from the canonical input result, and replaces disclaimer/fallback with server-side localized constants. Only free-text fields may change.
- All model output is bounded and strict: candidates max 5, final results max 5, compactTraitSummary 20-35 items, uncertaintyNotes arrays max 40, capped string lengths on every text field. Invalid, oversized, or mixed-language output is rejected as `AiResponseInvalid` (after the model fallback chain) — never partially accepted.
- `languageCode` is normalized to the default locale when missing or invalid; it is never interpolated into prompts unvalidated.
- MAX_FINAL_RESULTS (4 -> 5) changes only in its single canonical `packages/shared` constant; no hardcoded 4s or 5s anywhere in prompts, schemas, backend caps, or UI.
- Prompt version `advanced-global-traits-v2` is added as an `as const` constant; existing prompt files are upgraded in place — no duplicate prompt files.
- The 221-field detailed-traits UI must lazy-render accordion panel content (no single uncontrolled block); the Accordion is a shared ui-primitives component with the full ARIA/keyboard contract.
- The frontend keeps one canonical structured result state; locale switch calls translate-result only — it never re-uploads or re-analyzes the image, and translation failure keeps the old result visible.
- No image persistence anywhere on the frontend (no localStorage/sessionStorage/IndexedDB); preview object URLs revoked; file input cleared on done/reset.
- `GEMINI_MODEL` remains env-driven through typed config; no new env vars are expected — if one appears, `.env.example`, local `.env`, and `docs/env-vars.md` update in the same slice.

## Permanent Policy Update Check

- New permanent rule discovered: yes (one candidate)
- If yes, describe the rule: any AI translation of structured results must preserve identity and numeric fields (names, scores, ranks, verdicts) via server-side overwrite from the canonical source — never by trusting the model to preserve them. Disclaimer and fallback text are always server-enforced localized constants.
- `rules/` updated: pending — to be recorded in `rules/14-ai-safety.md` during phase 14 in the same delivery stream
- `CLAUDE.md` / `AGENTS.md` mirror updated: pending — only if the rule is confirmed as product-permanent at phase 23; the existing Twinzy constraints (free, no biometrics, memory-only image, text-only downstream prompts, env model, Zod+safety, no enum) are unchanged and need no edit
- Decision recorded in `memory/`: pending — `memory/ai-safety-decisions.md` entry in the same delivery stream

## Exit Checklist

- [x] Standards reviewed (rules 00, 01, 05, 06, 09, 10, 12, 13, 14, 15, 16, 18, 21, 22, 24 + testing/ + engineering-standards.md)
- [x] Request-specific rules documented (ten rules above)
- [x] Permanent-rule update decision made (one candidate rule, update path assigned)
- [x] Implementation constraints are visible to the team (this artifact + linked spec)

## Sign-Off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Technical owner | Ihab | approve | 2026-07-07 |

## Evidence And References To Attach

- Source spec: `D:/Freelance/TwinzyV2.md` (advanced-global-traits-v2 full requirements)
- `rules/00-non-negotiable-rules.md`, `rules/14-ai-safety.md`, `rules/15-file-upload-security.md`, `rules/12-i18n.md`, `rules/13-accessibility.md`, `rules/21-dto-validation.md`, `rules/24-release-gate.md`
- `context/architecture-map.md`, `docs/sdlc/engineering-standards.md`, `testing/README.md`
- Mechanical enforcement: `eslint.config.mjs` + `eslint/` layer-boundary plugin, `tsconfig.base.json`, Husky hooks under `.husky/`
- Related artifacts: `docs/features/advanced-global-traits-v2/08-architecture-review.md`, `09-impact-analysis.md`, `11-test-strategy.md`, `12-coverage-plan.md`

## Phase Blockers

Do not close this phase if:

- request-specific constraints are only in someone's head — cleared: all ten are written above
- permanent-rule implications were noticed but not reflected in `rules/` and the `CLAUDE.md` mirror — tracked: the translation-preservation rule has an assigned pending update in `rules/14` and `memory/` within this delivery stream; closing phase 23 without it is a blocker
- implementation standards still differ between people working the change — cleared: single owner (Ihab); this artifact is the frozen reference
