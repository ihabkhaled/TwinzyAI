# TwinzyAI Hardening v3 — 32-Section Audit & Prioritized Implementation Plan

**Request ID:** twinzy-hardening-v3  
**Audit date:** 2026-07-09  
**Scope:** Frontend, backend, shared package, prompts, security, performance, reliability, UX, Playwright coverage, package health, and developer governance.  
**Status:** Audit complete. Implementation not started.  
**Critical blocker:** Plaintext `GEMINI_API_KEY` present in `.env`. Acknowledged as accepted-for-now by request owner; must be rotated before any production exposure.

---

## 1. Repository structure audit

**Status:** Generally sound, one dev-experience gap.

- Monorepo layout (`apps/web`, `apps/api`, `packages/shared`) is clean and follows the documented architecture.
- `packages/shared` must be built before dependent apps consume it. The root `dev` script was already updated to `npm run build:shared && concurrently ...` to avoid the `Module not found: Can't resolve '@twinzy/shared'` error.
- `node_modules` content from `@types/node`, `@types/supertest`, `undici-types` appears as untracked files under `apps/api/node_modules`. This is usually a sign that `npm install` was run with a stale lockfile or a workspace package was not hoisted correctly. It should be cleaned and re-installed.
- `package-lock.json` shows a large untracked/stale delta; it should be regenerated from a clean install and committed.

**Risk:** Medium — clean build reproducibility.

---

## 2. Frontend architecture audit

**Status:** Architecture is declared, minor drift and tooling gaps.

- Frontend OS is documented as `Component → Hook → Service → Gateway` on `app → modules/<feature> → shared → packages/<vendor>`.
- Components are split into `*.component.tsx` (pure JSX) and `*.container.tsx` (composition + light orchestration). Custom ESLint rules enforce this (`no-hooks-in-components`, `no-inline-component-logic`).
- Layer boundaries are mostly respected; however, some tests live under `test/` (singular) while the unit-testing standard mandates `tests/` (plural). This is a naming inconsistency.
- No direct SDK or raw fetch in business code — HTTP is wrapped in `packages/axios`, storage in `packages/storage`, i18n in `packages/i18n`.
- Duplicate locale definitions exist: `apps/web/src/packages/i18n/locale.constants.ts` redefines `SUPPORTED_LOCALES`/`isSupportedLocale`/`AppLocale` that already live in `packages/shared/src/constants/language.constants.ts`.
- Frontend coverage is not mechanically gated. `testing/frontend/coverage-policy.md` references an `apps/web/vitest.config.mts` that does not exist.

**Risk:** Medium — drift on single source of truth and coverage enforcement.

---

## 3. Backend architecture audit

**Status:** Strong layered discipline, a few boundary exceptions.

- One-way dependencies are enforced: `api → application → domain → infrastructure/adapters`.
- Controllers are thin and delegate a single application call per handler (`apps/api/src/modules/game/api/game.controller.ts`).
- Use cases (`analyze-game.use-case.ts`, `analyze-game-stream.use-case.ts`) own orchestration; services (`style-match.service.ts`, `result-translation.service.ts`) own focused capabilities.
- The `game-stream.presenter.ts` file sits under `api/` but holds real orchestration (heartbeats, watchdog, disconnect handling, slot release). It is either a presenter that should move to `application/` or an explicit boundary exception that needs an ADR.
- `apps/api/src/core/http/sse-writer.ts` holds branch logic and is tested but not included in the coverage allowlist.
- The `no-console` rule and AppLogger (pino) discipline are in place; no raw `console.*` is expected.

**Risk:** Medium — presenter placement and coverage allowlist holes.

---

## 4. Shared package audit

**Status:** Good single-source taxonomy, several schema and constant gaps.

Detailed findings from the shared package subagent:

- **Result count constants are hardcoded to 5.** `packages/shared/src/constants/trait.constants.ts` defines `MAX_CANDIDATES = 5` and `MAX_FINAL_RESULTS = 5`. These must become 10 (or driven by a new `DEFAULT_RESULT_COUNT` / `MAX_RESULT_COUNT`) for the requested 1–10 feature.
- **No `DEFAULT_RESULT_COUNT`.** The shared package lacks a canonical default result count; only `DEFAULT_LANGUAGE_CODE` exists.
- **No `MIN_RESULT_COUNT` / `MIN_JUDGED_RESULTS`.** Empty result arrays are accepted with no cross-field rule tying them to a non-empty `fallbackMessage`.
- **`traitCount` is unenforced.** `TraitExtractionResponseSchema` accepts `traitCount` but does not refine it to equal the actual number of populated trait fields. The candidate schema already has this refinement (`candidateCount === candidates.length`).
- **Judge schema lacks per-result `safetyCheck`.** `CandidateSchema` and `TraitExtractionResponseSchema` both carry structured safety flags; `JudgedResultSchema` does not.
- **`compactTraitSummary` bounds diverge.** `game-stream.schema.ts` uses `.max(MAX_COMPACT_TRAIT_SUMMARY)` without `.min(1)`, while `traits.schema.ts` and `game-result.schema.ts` require `.min(1).max(...)`.
- **Duplicate `SUPPORTED_LOCALES`.** `apps/web/src/packages/i18n/locale.constants.ts` duplicates `packages/shared/src/constants/language.constants.ts`.
- **Duplicate `LanguageCode` type alias.** `language.schema.ts` exports a `LanguageCode` type that is unused; `LanguageCodeValue` from constants is the real public name.
- **Duplicate `PROMPT_VERSION` alias.** `apps/api/src/modules/ai/model/prompt-version.constants.ts` re-exports `GAME_PROMPT_VERSION` as `PROMPT_VERSION`, creating two names for the same value.
- **Three copies of `traitReferenceSchema`.** `candidates.schema.ts`, `judge.schema.ts`, and `game-result.schema.ts` each define an identical private `traitReferenceSchema`.
- **No Zod schema for `ApiErrorResponse`.** `packages/shared/src/interfaces/api-error.interface.ts` is a TypeScript interface only; the frontend cannot Zod-validate server error envelopes.
- **Coverage allowlist only includes `utils/`.** Schemas, enums, and constants are tested but not gated by the 95/90/95/95 threshold.
- **Directory name mismatch:** `packages/shared/src/interfaces/` should be `types/` per the rule that mandates `types/` (or `model/`) for reusable types.

**Risk:** High — these are the contract gaps that the result-count feature and prompt vNext must fix.

---

## 5. Prompt pipeline audit

**Status:** Three-prompt design is correct, prompts need vNext rewrite and version bump.

- Four prompt files exist: `use-1st-prompt.md`, `use-2nd-prompt.md`, `use-3rd-prompt.md`, `translate-result-prompt.md`. Prompts are loaded via `PromptLoaderService`, not inline.
- Current prompt version is `advanced-global-traits-v2` (`packages/shared/src/constants/app.constants.ts`). The vNext rewrite must bump this version.
- Prompt 1 sees the image only; prompts 2 and 3 are text-only. This privacy invariant is correct and enforced by tests (FakeAiAdapter records image vs text calls).
- Prompt 1 needs to extract a richer, more specific visible-trait taxonomy without crossing into identity/biometrics. The recommended output shape includes `traits`, `compactTraitSummary`, `highSignalTraitTokens`, `weightedTraitEvidence`, `visualArchetypeHints`, `imageQualityCaps`, `uncertaintyNotes`, `candidateSearchHints`, `safetyCheck`.
- Prompt 2 should consume the requested result count and generate a candidate pool larger than N (e.g., `min(max(N * 2, N + 3), safeMax)`), but never force 90+ scores.
- Prompt 3 should re-score independently, penalize uncertainty, remove unsafe/weak candidates, and return exactly N results (or fewer only when safety/quality requires it).
- Translation prompt must preserve canonical names, scores, ranks, and `promptVersion` while changing only user-facing text.
- Safety filtering is applied server-side after each prompt, not only by prompt instruction.

**Risk:** High — output quality depends on prompt vNext and server-side enforcement.

---

## 6. Image upload/privacy audit

**Status:** Privacy model is correct and mostly enforced.

- Images are processed in memory only; buffers are zero-filled in `finally`.
- No image bytes, base64, or raw prompts are logged in production.
- No image persistence, no embeddings, no biometric templates.
- Only the trait-extraction prompt sees the image; candidate and judge prompts are text-only.
- The uploaded image is never returned to the client.
- Privacy redaction tests exist that verify no base64 appears in logs.

**Risk:** Low — privacy model is sound, but implementation must be re-verified after any file-security refactor.

---

## 7. File-security audit

**Status:** Multi-layer validation exists, one production gap.

- Validation layers: consent flag, single file, size cap, MIME type, extension, extension/MIME consistency, magic bytes, image decode, optional ClamAV.
- `TemporaryFileCleanupService` ensures buffers are wiped and temp files are removed.
- ClamAV is configured to fail closed in production (`VirusScanUnavailableError` 503), but there is no HTTP integration test proving this path end-to-end.
- File-security service has unit tests; the `file.buffer.length === 0` guard lacks a dedicated case.
- No integration test for the ClamAV fail-closed HTTP path.

**Risk:** Medium — ClamAV fail-closed is not proved at the HTTP boundary.

---

## 8. AI safety audit

**Status:** Safety architecture is present but a guardian test is weak.

- `FORBIDDEN_RESULT_PHRASES` and `FORBIDDEN_SENSITIVE_TOPICS` are centralized in `packages/shared/src/constants/safety.constants.ts` and merged in `apps/api/src/modules/ai/model/ai-safety.constants.ts`.
- Every AI response is Zod-validated and safety-filtered before use.
- `AiSafetyService` is the guardian of the primary product safety promise, but its unit test has only one branch and mocks out `containsForbiddenWording`. This is a critical gap.
- No Arabic forbidden-phrase list exists even though the API returns Arabic output. The current list is English-only.
- `FORBIDDEN_RESULT_PHRASES` includes trailing-space entries (`'you are '`, `'the person is '`). The scanner must tokenize, not rely on simple substring matching, or these constants will miss end-of-string/punctuation cases.
- Judge schema lacks a per-result `safetyCheck` flag, so the final stage has no structured safety signal beyond `shouldDisplay`.

**Risk:** High — the guardian service is under-tested and the judge schema lacks a safety signal.

---

## 9. Result scoring audit

**Status:** Score bands are declared, calibration needs tightening.

- Score bounds: `MIN_SCORE = 0`, `MAX_SCORE = 100`, `MIN_DISPLAY_SCORE = 70`.
- `Verdict` enum (`strong`, `medium`, `weak`) exists, but there is no explicit mapping from score to verdict band (e.g., `strong ≥ 85`, `medium ≥ 70`, `weak < 70`).
- The current rule `MIN_DISPLAY_SCORE = 70` filters out weak candidates; this is the only server-side calibration.
- No forced 90+ is required by product policy. The prompt and judge must calibrate so 90+ is only awarded when many strong visible traits align.
- Score caps should be applied based on image quality and trait uncertainty.
- The aggregator should sort descending, cap uncertain scores, and enforce the requested result count.

**Risk:** Medium — scoring calibration is a product-quality issue, not a security issue.

---

## 10. Result count audit

**Status:** Feature is not implemented; hardcoded 5 is everywhere.

- `MAX_CANDIDATES = 5` and `MAX_FINAL_RESULTS = 5` in `packages/shared/src/constants/trait.constants.ts`.
- Candidate generation schema enforces `.min(MIN_CANDIDATES).max(MAX_CANDIDATES)` (5).
- Judge schema enforces `.max(MAX_CANDIDATES)` (5).
- Final game result schema enforces `.max(MAX_FINAL_RESULTS)` (5).
- No default result count constant exists.
- UI has no result-count dropdown.
- Analyze request DTO does not accept `resultCount`.
- Streaming request does not pass `resultCount`.
- Translation response does not explicitly preserve the original result count (it inherits from the final result, but no contract refines it).

**Required change:** Implement 1–10 result count with default 10, shared schema, backend validation, frontend dropdown, prompt consumption, and aggregation enforcement.

**Risk:** High — this is the core feature gap.

---

## 11. Error handling audit

**Status:** Typed error model is strong, a few gaps.

- Errors are typed `AppError` with `messageKey` pattern `errors.<feature>.<key>`.
- No generic `Something went wrong` UX is used; user-facing errors are localized via i18n.
- Error codes exist (`AI_TIMEOUT`, `AI_PROVIDER_UNAVAILABLE`, etc.) but the stream error schema uses `z.string().min(1)` for `errorCode` instead of a closed set.
- The shared package has no Zod schema for `ApiErrorResponse`, so the frontend cannot validate the error envelope.
- No integration test for the streaming endpoint when the `Origin` is not in the allowlist.
- Some tests use raw `try / catch` for rejection assertions instead of the standard `rejects.toBeInstanceOf` idiom, which can silently pass if the promise is not awaited.

**Risk:** Medium — contract validation of error envelopes is missing.

---

## 12. User-facing message audit

**Status:** i18n-first design is in place, one backend English leak.

- All user-facing strings route through `packages/i18n` dictionaries (`en.json`, `ar.json`).
- Error messages have stable `messageKey` values, localized titles and descriptions, and user actions.
- `apps/api/src/modules/ai/model/prompt-version.constants.ts` contains `GENERIC_PROMPT_ERROR` as a hardcoded English string. This is a backend-only fallback but is user-facing and should be i18n-routed or removed in favor of a `messageKey`.

**Risk:** Low — one hardcoded English error string.

---

## 13. i18n audit

**Status:** Two-language support is solid, duplicate constants exist.

- English (LTR) and Arabic (RTL) are supported.
- `packages/i18n` wraps message loading and direction switching.
- `useResultTranslation` hook proves translation preserves canonical names/scores/ranks at the unit level.
- Duplicate `SUPPORTED_LOCALES`/`isSupportedLocale`/`AppLocale` in `apps/web/src/packages/i18n/locale.constants.ts` vs. `packages/shared/src/constants/language.constants.ts`.
- Arabic forbidden-phrase safety list is missing.

**Risk:** Medium — duplicate constants create maintenance risk when adding a third locale.

---

## 14. Accessibility audit

**Status:** PWA a11y tests exist, coverage is shallow.

- Playwright `pwa-a11y.spec.ts` runs `axe-core` on `/` and `/game` at `serious`/`critical` impact levels.
- No a11y coverage of the results state (accordions, disclaimer, result list) because the analyze flow is not triggered in the a11y spec.
- Keyboard navigation and screen-reader labels are claimed but not deeply covered by e2e.
- Result-count dropdown must be keyboard-accessible and have an `aria-label`.

**Risk:** Medium — functional results-state a11y is untested.

---

## 15. Mobile UX audit

**Status:** Mobile-first intent is declared, e2e emulation is weak.

- Web package is documented as mobile-first PWA.
- Playwright only uses Desktop Chrome with raw viewport overrides; no real mobile emulation (`Pixel 5`, `iPhone 13`) or Safari/WebKit projects.
- `mobile-theme.spec.ts` tests viewport widths 320/375 but does not use Playwright device projects, so touch behavior, DPR, and UA are not realistic.
- Result cards, upload CTA, progress steps, and streaming feedback need mobile-specific hierarchy and spacing review.

**Risk:** Medium — mobile UX is not proved under realistic browser emulation.

---

## 16. Playwright coverage audit

**Status:** Three spec files, many critical gaps.

Existing specs:
- `game-flow.spec.ts` — happy path, invalid MIME, mocked API failure + retry.
- `mobile-theme.spec.ts` — viewport widths, dark/light background.
- `pwa-a11y.spec.ts` — manifest, viewport meta, axe on `/` and `/game`.

Missing scenarios (per the user's requirements):
1. Consent gating on streaming endpoint
2. Result-count dropdown defaults to 10 and can select 1/5/10
3. Analyze sends selected result count
4. Streaming progress shows all stages
5. Successful result renders requested count
6. Trait summary, uncertainty notes, mismatch warnings
7. Retry after recoverable failure
8. Cancel during streaming
9. Translate result without re-upload
10. Arabic translation preserves canonical names/ranks/scores
11. Oversized file / unsupported file / backend validation error UX
12. Model timeout / safety-filtered output / network failure UX
13. Refresh does not leak image data
14. No image persists after reset
15. Keyboard navigation and screen-reader labels
16. Real mobile emulation projects
17. Visual regression for main screens
18. Privacy/disclaimer always visible near results

Also: `visual` project is defined in `playwright.config.ts` but has no matching spec; `test:visual` passes with `--pass-with-no-tests`.

**Risk:** High — business flows are not covered by e2e.

---

## 17. Unit/integration test audit

**Status:** Good unit/integration bones, coverage holes and test-quality gaps.

Strengths:
- 27 API unit tests, 5 API integration tests, 3 shared tests, 46 web unit tests.
- Deterministic `FakeAiAdapter` proves the image-only-to-step-1 invariant.
- Real DI wiring via `Test.createTestingModule` and `.overrideProvider`.
- Privacy assertions (buffer wipe, no disk write, no base64 in logs).

Gaps:
- `TemporaryFileCleanupService`, `StyleMatchService`, `AnalyzeGameStreamUseCase`, `TranslateResultUseCase`, `ResultTranslationService` have no direct unit tests.
- `ai/lib/{ai-response-sanitizer, forbidden-wording.guard, json-response.util, trait-text.util}` and `game/lib/{consent, request-language}` and `result-aggregation/lib/{helpers, mapper}` have no direct tests.
- `AiSafetyService` has only one branch test and mocks its own collaborator.
- Two tests use real 20 ms wall-clock timeouts (`concurrency-limiter.service.test.ts`, `game-stream.presenter.test.ts`), which is a flake risk.
- No integration test for rate limiter, ClamAV fail-closed HTTP path, cancel-during-stream, or streaming CORS disallowlist.
- Frontend fixture builders are missing; each web test builds its own SSE/final-result payloads.
- `apps/web/src/tests/setup.ts` has a module-level `objectUrlCounter` that is never reset, creating order-dependency risk.
- Coverage allowlist has no `api/` or `core/http/sse-writer.ts`, and only `packages/shared/src/utils/` is included.

**Risk:** High — missing tests for critical safety and orchestration paths.

---

## 18. Performance/scalability audit

**Status:** Bounded by design, could be hardened.

- `MAX_GLOBAL_ACTIVE_ANALYSES`, `MAX_ACTIVE_ANALYSES_PER_IP`, `MAX_ACTIVE_ANALYSES_PER_TAB`, and `MAX_ANALYSIS_QUEUE_SIZE` exist in `.env.example` and config.
- `ConcurrencyLimiter` and `StreamRegistry` manage active streams and slots.
- Upload size is capped (`DEFAULT_MAX_IMAGE_SIZE_BYTES`).
- Image is never persisted to disk; memory is bounded by buffer size and temp-file cleanup.
- No integration test for memory pressure under concurrent uploads.
- No explicit latency metrics per pipeline stage in production logs.
- No load test or benchmark for the SSE endpoint under high concurrency.

**Risk:** Medium — bounded but not measured under load.

---

## 19. Non-blocking I/O audit

**Status:** SSE is non-blocking, a few synchronous risks.

- Streaming uses SSE (`GameStreamEvent`, `GameStreamMessageSchema`, `StreamRegistry`).
- `sse-writer.ts` handles Fastify response hijacking.
- Cancellation is registry-based and safe.
- Avoid synchronous CPU-heavy work on the request path. Image decode and metadata extraction should be audited for blocking operations.
- Large JSON transformations (e.g., 221-field trait taxonomy) could be expensive; ensure they are cached/compiled once, not per request.

**Risk:** Medium — JSON/schema compilation and image decode should be profiled.

---

## 20. Worker/multi-process feasibility audit

**Status:** Not implemented; options documented.

- Current architecture is single-process Node.js + Fastify.
- Options for scaling:
  - **Node.js cluster mode** — can use all CPU cores for the API; SSE/cancellation registry becomes per-process, so a shared store (Redis) is needed for horizontal scaling.
  - **PM2 cluster mode** — similar to Node cluster but with better process management.
  - **Docker horizontal scaling** — multiple API containers behind a load balancer; requires sticky sessions or shared SSE/cancel store.
  - **worker_threads** — useful only for CPU-heavy image metadata/decode if profiling proves it is blocking the event loop.
  - **Piscina** — justified only if a worker pool is needed for image tasks.
  - **Queue-based async processing** — not appropriate unless the product accepts an async UX (user returns later for results).
- Recommendation: Do not add complexity now. Keep the single-process design, document horizontal-scaling implications in an ADR, and add observability first. If load testing reveals a bottleneck, evaluate `worker_threads` for image decode before cluster/PM2.

**Risk:** Low — no immediate scaling bottleneck; document the plan.

---

## 21. Package version and lockfile audit

**Status:** Needs cleanup and dependency review.

- `package-lock.json` and `apps/api/node_modules` show untracked/stale deltas. A clean `npm install` from the root should be run and the lockfile committed.
- `zod ^4.4.3` in `packages/shared` is current and stable.
- The repository uses npm workspaces. `package.json` defines the `dev`, `build`, `build:shared`, `lint`, `typecheck`, `test:*`, and `security:scan` scripts.
- No audit of deprecated or vulnerable packages has been performed in this run beyond the Trivy secret finding. `npm audit` should be run and documented.
- Unused packages should be identified and removed.

**Risk:** Medium — reproducibility and supply-chain hygiene.

---

## 22. Security scan readiness audit

**Status:** Scripts exist, one critical failure.

- `npm run security:scan` is configured.
- Trivy is an external binary, not an npm package. The project should document how to install Trivy per OS or provide a dev script that checks for Trivy presence and prints install steps.
- The Trivy secret scanner failed to detect the plaintext `GEMINI_API_KEY` in `.env`. This means the current Trivy configuration is insufficient for secret detection.
- `npm audit` is available but not yet run and documented in this audit.
- No CI gate proved to run both `npm audit` and Trivy.
- `dangerouslySetInnerHTML`, open redirects, unsafe URLs, and untrusted file writes are not present in the inspected code.

**Risk:** High — Trivy secret detection is not catching the actual secret.

---

## 23. Trivy integration audit

**Status:** Trivy is present but not trustworthy for secrets.

- Trivy is invoked via `npm run security:scan` but is not an npm dependency.
- The plaintext API key in `.env` went undetected, indicating either:
  - Trivy is not configured to scan `.env` files, or
  - The secret detection rules are too narrow for Google API keys, or
  - Trivy is not installed/running correctly.
- Recommendation: verify Trivy version and config, add explicit `.env` scanning rules, and add a complementary secret scanner (e.g., GitHub secret scanning, `detect-secrets`, or `git-secrets`) as a fallback. Do not rely on Trivy alone for secret detection.

**Risk:** High — false-negative on the highest-risk finding.

---

## 24. ESLint custom rule audit

**Status:** Backend plugin is tested, frontend plugin is not.

Backend architecture plugin (`eslint/architecture-plugin.mjs`):
- 10 rules registered; 9 have RuleTester tests.
- `no-raw-library-imports` has **no** RuleTester test.
- `no-restricted-vendor-imports` test only asserts `axios`; the policy regex covers more packages (`got`, `ky`, `undici`, `superagent`) but they are not tested.
- `controller-no-logic` does not fire on `.presenter.ts` files, allowing the `game-stream.presenter.ts` orchestration to escape the rule.

Frontend architecture plugin (`eslint/frontend-architecture-plugin.mjs`):
- **13 rules registered, zero RuleTester tests.**
- These rules encode the entire frontend OS (`no-hooks-in-components`, `no-inline-declarations`, `no-inline-component-logic`, `no-raw-package-imports`, `no-direct-browser-api-outside-packages`, etc.). A regression will only be caught by an unrelated lint failure, not by the plugin's own suite.

Missing rule enforcement:
- `@typescript-eslint/no-magic-numbers` is documented as a non-negotiable but is **not enabled** anywhere in production code. It is only disabled in tests.

**Risk:** High — architecture-as-code is untested for the frontend and unenforced for magic numbers.

---

## 25. Code readability audit

**Status:** Generally clean, a few long files and deep mocks.

- Most services and use cases are short and readable.
- `game-stream.presenter.ts` is larger than typical transport-layer files and mixes orchestration with transport concerns.
- `analyze-game.use-case.test.ts` and `game-stream.presenter.test.ts` have deep mocks and casts that reduce readability.
- Some integration tests duplicate bootstrapping code (`Test.createTestingModule(...).overrideProvider(...).compile()`) that should be extracted into a `bootTestApp` helper.
- Extract helpers: `parseStream` is duplicated across three SSE test files.

**Risk:** Low — mostly test-side readability issues.

---

## 26. Duplicated logic audit

**Status:** Several duplicates found.

- `SUPPORTED_LOCALES`/`isSupportedLocale`/`AppLocale` in web vs. `LANGUAGE_CODES`/`isSupportedLanguageCode`/`LanguageCodeValue` in shared.
- `PROMPT_VERSION` re-exports `GAME_PROMPT_VERSION`.
- Three identical private `traitReferenceSchema` definitions in `candidates.schema.ts`, `judge.schema.ts`, `game-result.schema.ts`.
- `parseStream` SSE parsing snippet duplicated in three test files.
- `buildConfigStub` in `apps/api/src/tests/fixtures/stubs.ts` is casted, not typed, so new config fields are silently missing.

**Risk:** Medium — maintenance risk and silent test drift.

---

## 27. Magic constants audit

**Status:** Non-negotiable is documented but unenforced.

- `rules/00-non-negotiable-rules.md` and `rules/05-types-enums-constants.md` forbid magic strings/numbers and inline domain constants.
- `MAX_CANDIDATES = 5`, `MAX_FINAL_RESULTS = 5`, `MIN_DISPLAY_SCORE = 70`, `GAME_PROMPT_VERSION`, upload size limits, MIME types, timeout values, etc., are centralized in `packages/shared` — good.
- However, ESLint does not enforce the rule. `@typescript-eslint/no-magic-numbers` is not enabled in production code.
- Test files and integration tests contain ad-hoc literal strings (`'photo.jpg'`, `'image/jpeg'`, `'consent'`) because `sonarjs/no-duplicate-string` is disabled in tests.

**Risk:** High — the rule is a non-negotiable but is not mechanically enforced.

---

## 28. Inline types/interfaces/enums/constants audit

**Status:** Rules are in place, frontend plugin untested.

- Backend `no-inline-domain-definitions` rule is enforced and has RuleTester tests.
- Frontend `no-inline-declarations` rule is enforced but has **zero** RuleTester tests.
- Shared package uses `interfaces/` folder name, which violates the rule that mandates `types/` (or `model/`).
- Some layer files contain small private schemas that are acceptable, but the frontend rules are not self-tested.

**Risk:** Medium — rule enforcement is real but not regression-proof for the frontend.

---

## 29. Long file/function/component audit

**Status:** Within thresholds except for noted cases.

- Backend service/use-case files are generally under 130 lines and 60 lines per function.
- `game-stream.presenter.ts` exceeds the transport-layer threshold because it holds orchestration (heartbeats, watchdog, disconnect handling, slot release).
- Frontend `*.component.tsx` and `*.container.tsx` are capped at 130 lines / 60 per function / `jsx-max-depth` by `eslint/frontend/component-size.config.mjs`.
- The web test folder naming (`test/` vs `tests/`) is a structural inconsistency, not a file-length issue.

**Risk:** Low — manageable; move presenter to `application/` or add an exception.

---

## 30. Generic error/failure message audit

**Status:** Strong typed error model, one hardcoded English fallback.

- Errors are typed `AppError` with `messageKey` pattern `errors.<feature>.<key>` and localized user-facing text.
- Stream error `errorCode` uses an unbounded string instead of a closed set, which weakens the contract.
- `apps/api/src/modules/ai/model/prompt-version.constants.ts` contains `GENERIC_PROMPT_ERROR` as a hardcoded English string. It should be replaced with a `messageKey` or removed.
- No generic `Something went wrong` as the only error path.

**Risk:** Low — one hardcoded string and one unbounded contract field.

---

## 31. Governance docs audit

**Status:** Canonical policy exists, docs need updating for the new feature.

- `CLAUDE.md`, `AGENTS.md`, `CODEX.md`, `cursor.md`, `.cursorrules`, `.cursor/rules/*.mdc` are present and aligned on precedence (`CLAUDE.md` > rules > agents > mirrors).
- `docs/sdlc/` contains permanent baselines.
- `testing/frontend/coverage-policy.md` references `apps/web/vitest.config.mts` that does not exist — doc drift.
- `testing/unit-testing-standard.md` says tests live in `tests/` but web uses `test/` — doc drift.
- No feature-specific SDLC artifacts (`docs/features/twinzy-hardening-v3/00-intake.md` … `13-implementation-readiness.md`) exist yet for this hardening/result-count work; they must be created before implementation begins per `CLAUDE.md`.
- `README.md`, `SECURITY.md`, `TEST_CASES.md` will need updates for result count, prompt vNext, score calibration, and expanded Playwright coverage.

**Risk:** High — missing SDLC phase artifacts for this change before implementation.

---

## 32. Final prioritized implementation plan

### Phase 0 — Immediate hygiene (do first)

1. Run a clean `npm install` from root, remove stale `apps/api/node_modules` content, and commit a regenerated `package-lock.json`.
2. Ensure `.env` is gitignored and add `.env.example` placeholders only. (Key rotation remains strongly recommended.)
3. Create the missing `docs/features/twinzy-hardening-v3/` SDLC phase artifacts (`00-intake.md` through `13-implementation-readiness.md`) before any code changes.

### Phase 1 — Shared contracts

1. Update `packages/shared/src/constants/trait.constants.ts`:
   - Add `MIN_RESULT_COUNT = 1`, `MAX_RESULT_COUNT = 10`, `DEFAULT_RESULT_COUNT = 10`.
   - Replace `MAX_CANDIDATES` / `MAX_FINAL_RESULTS` usage with `MAX_RESULT_COUNT` where they represent the user's final count; keep a separate internal candidate-pool cap if needed.
2. Add `ResultCountSchema` in `packages/shared/src/schemas/` and export it.
3. Add `ApiErrorResponseSchema` in `packages/shared/src/schemas/` or `types/`.
4. Update `AnalyzeRequestDto` / `AnalyzeStreamRequestDto` in backend to accept `resultCount` (integer 1–10, default 10).
5. Add cross-field refinements:
   - `traitCount === actual populated trait fields`
   - `fallbackMessage` semantics when results are empty
   - `disclaimer` matches `RESULT_DISCLAIMER_BY_LANGUAGE` values
6. Rename `packages/shared/src/interfaces/` to `packages/shared/src/types/` and move `api-error.interface.ts` there.
7. Extract a single `traitReferenceSchema` shared helper.
8. Remove duplicate `LanguageCode` type and the `PROMPT_VERSION` re-export.
9. Add `packages/shared/src/schemas/**/*.ts` to the coverage allowlist.

### Phase 2 — Backend implementation

1. Update `analyze-request.dto.ts` to parse and validate `resultCount`.
2. Update use cases (`analyze-game.use-case.ts`, `analyze-game-stream.use-case.ts`) to pass `resultCount` through the pipeline.
3. Update services (`style-match.service.ts`, `result-translation.service.ts`) to respect the count.
4. Update prompt rendering to inject `resultCount` into prompts 2 and 3.
5. Update result aggregation to enforce `requestedResultCount`, sort, cap scores, and inject the server-owned disclaimer.
6. Update translation to preserve `resultCount`, canonical names, scores, ranks, and `promptVersion`.
7. Add `safetyCheck` to `JudgedResultSchema` / `FinalResultItemSchema`.
8. Add direct unit tests for all currently untested application/lib files listed in §17.
9. Convert real-time watchdog tests to `vi.useFakeTimers()`.
10. Add integration tests for rate limiter, ClamAV fail-closed HTTP path, cancel-during-stream, and CORS disallowlist.

### Phase 3 — Prompts vNext

1. Rewrite `use-1st-prompt.md`, `use-2nd-prompt.md`, `use-3rd-prompt.md` with richer taxonomy, result count, calibrated scoring, and no forced 90+.
2. Update `translate-result-prompt.md` if needed to preserve canonical fields.
3. Bump `GAME_PROMPT_VERSION` from `advanced-global-traits-v2` to `advanced-global-traits-v3`.
4. Update `FakeAiAdapter` and fixtures to emit the new version.
5. Add prompt tests that assert version echo, schema validity, and no forbidden wording.

### Phase 4 — Frontend implementation

1. Add a result-count dropdown in the upload flow (default 10, options 1–10, accessible label, localized).
2. Update `useGame.hook.ts` and related hooks to store and send `resultCount`.
3. Update gateways (`game-stream.gateway.ts`, `game.gateway.ts`) to include `resultCount`.
4. Update the analyze request schema to validate `resultCount`.
5. Update result rendering to show the requested count and explain the score/uncertainty/mismatch sections.
6. Improve UX: upload CTA, privacy reassurance, progress steps, streaming feedback, score explanation, mismatch warnings, retry/cancel flows, Arabic RTL, mobile layout.
7. Remove duplicate `SUPPORTED_LOCALES` from `apps/web/src/packages/i18n/locale.constants.ts` and import from `@twinzy/shared`.
8. Add frontend fixture builders under `apps/web/src/tests/fixtures/`.

### Phase 5 — Security hardening

1. Run `npm audit` and remediate or document high/critical vulnerabilities.
2. Verify Trivy install and config; add fallback secret scanning (e.g., `detect-secrets` or `git-secrets`) to catch `.env` keys.
3. Add docs for installing Trivy per OS.
4. Review and tighten CORS allowlist, helmet headers, and rate limits.
5. Ensure no image/base64/prompt/raw-provider response is logged in production.
6. Replace `GENERIC_PROMPT_ERROR` with a localized `messageKey`.

### Phase 6 — Performance/scalability

1. Add per-stage timing metrics (trait extraction, candidate generation, judging, translation) with request-id correlation.
2. Profile image decode and JSON/schema compilation for blocking work; cache compiled schemas if not already cached.
3. Document horizontal-scaling implications in an ADR (SSE/cancel store, sticky sessions, ClamAV daemon under load).
4. Do not implement cluster/workers unless profiling proves it is needed.

### Phase 7 — Testing expansion

1. Add RuleTester tests for all 13 frontend architecture rules.
2. Add RuleTester test for `no-raw-library-imports`.
3. Enable `@typescript-eslint/no-magic-numbers` in production code.
4. Add `perFile: true` coverage thresholds.
5. Expand Playwright coverage to the 35+ scenarios listed in §16, including mobile device projects, cancel, streaming stages, translation, file boundaries, and visual regression.
6. Add manual testing rounds with documented inputs and conclusions.

### Phase 8 — Documentation update

1. Update `README.md`, `SECURITY.md`, `TEST_CASES.md` for result count, prompt vNext, score calibration, and expanded tests.
2. Update `testing/frontend/coverage-policy.md` and `testing/unit-testing-standard.md` to match reality (or create the missing `apps/web/vitest.config.mts`).
3. Update `CLAUDE.md` / `AGENTS.md` / mirrors if any new permanent rule emerges (e.g., result count schema, magic-number enforcement).
4. Add ADR for horizontal-scaling plan and prompt vNext changes.
5. Create runbook updates for secret rotation, Trivy, and incident response.

### Phase 9 — Validation gates

Run the authoritative gate sequence and do not claim success without evidence:

```bash
npm install
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:a11y
npm run test:visual
npm run test:coverage
npm run build
npm run audit
npm run security:scan
npm run quality:dead-code
npm run quality:circular
npm run validate
```

Report exactly which commands pass and which fail, with root-cause notes.

### Phase 10 — Commit and release readiness

1. Conventional-commits through Husky hooks; do not bypass.
2. Commit in reviewable slices: contracts, backend, prompts, frontend, security, tests, docs.
3. Push only when explicitly asked.
4. Prepare release notes, go/no-go criteria, rollback plan, and hypercare window.

### Final definition of done for this request

- [ ] Result count 1–10 exists in shared schema, backend DTO, frontend UI, and prompt rendering.
- [ ] Default result count is 10.
- [ ] Prompts are rewritten to vNext with calibrated, evidence-based scores and no forced 90+.
- [ ] Scores are capped by uncertainty and image quality; UI explains low scores.
- [ ] Shared schema gaps are closed (trait count, safety check on judge, fallback semantics, disclaimer, error envelope, duplicate constants removed).
- [ ] No recognition/identity/biometric/exact-lookalike claims in code or prompts.
- [ ] Image stays memory-only, wiped in `finally`, never logged or persisted.
- [ ] AI safety service is properly tested; forbidden wording is blocked server-side.
- [ ] ESLint magic-number rule is enabled and all 13 frontend architecture rules have RuleTester tests.
- [ ] Playwright covers the 35+ required scenarios, including mobile device projects and visual regression.
- [ ] All validation gates are run and reported.
- [ ] Docs and SDLC artifacts are current.
- [ ] `.env` secret is rotated or accepted as a tracked risk.
