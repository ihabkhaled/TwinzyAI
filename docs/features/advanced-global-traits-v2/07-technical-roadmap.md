# 07 - Technical Roadmap

- Request ID: TWZ-V2-001
- Feature: advanced-global-traits-v2
- Date: 2026-07-07
- Owner / approver: Ihab (product + engineering)
- Track: standard (safety-critical surfaces touched: prompts, schemas, safety filter)

## Purpose

Define the engineering execution phases for upgrading Twinzy from the 15-flat-trait pipeline to the advanced global pipeline (221 nested trait fields across 16 categories, up to 5 global final results, `languageCode` end-to-end, translate-without-re-analysis endpoint), sequenced into safe, reviewable slices that keep every gate green and every safety invariant intact.

## Step-by-Step Workflow

1. Break the upgrade into 6 milestones, ordered so shared contracts land additively before any consumer changes behavior.
2. Follow repo convention: conventional commits per slice on `main`, Husky pre-commit/pre-push gates on every commit (lint 0/0, typecheck, tests, coverage on touched modules).
3. Evolve contracts in `packages/shared` first (Zod strict, bounded, `as const` — no TS `enum`); the `/api/v1` envelope stays unchanged, payloads are versioned by `promptVersion: 'advanced-global-traits-v2'`. There is no database schema in this repository.
4. Roll out API + web together (single monorepo deploy, stateless product); roll back by reverting slice commits in reverse order.
5. Each slice is tests-first, independently reviewable, and independently revertable.

## Engineering Milestones

| Milestone | Description | Dependencies | Merge criteria |
| --- | --- | --- | --- |
| 1 — Shared contracts (additive) | `packages/shared`: language-code schema + constants (`en`/`ar`, normalize-to-default), prompt version constant `advanced-global-traits-v2`, 16 nested trait-category strict schemas (221 fields total: imageQuality, overallFace, faceShapeAndProportions, foreheadAndHairline, hair, eyebrows, eyes, nose, cheeksAndCheekbones, mouthAndLips, jawlineAndChin, facialHair, skinToneAndVisibleTexture, expressionAndPose, groomingAndStyle, styleVibeDescriptors), uncertaintyNotes (4 bounded arrays, max 40 entries), compactTraitSummary (20–35), traitCount, safetyCheck flags, advanced candidate schema (confidenceLevel, globalPopularityLevel, aligned/mismatch arrays), judge/final-result schema (verdict, countryOrRegion, publicCategory, shouldDisplay, removedCandidates), translation request/response schemas, verdict/confidence/popularity/public-category `as const` constants, forbidden-wording constant extensions. All bounded (array sizes, string max lengths). No runtime behavior change yet; `MAX_FINAL_RESULTS` NOT bumped here. | none | Schema unit tests first and green; lint 0/0; typecheck; existing api/web builds unaffected (purely additive) |
| 2 — Prompts + AI module | Rewrite `apps/api/src/modules/ai/prompts/use-1st-prompt.md` (advanced extraction, 100+ trait target, localized "unclear"), `use-2nd-prompt.md` (5 global candidates, conservative scoring, 90+ rare), `use-3rd-prompt.md` (strict judge: rescore, penalize overconfidence/unclear images, removedCandidates, mandatory disclaimer); add `translate-result-prompt.md` (text-only, Prompt 4). Update prompt-template repository, trait-extraction / candidate-generation / candidate-judge services, `gemini.adapter.ts` plumbing for `languageCode`, ai-safety service coverage for every new text field. Keep model fallback chain + `AiResponseInvalid` on invalid/oversized/mixed-language JSON. | 1 | Prompt/schema tests green (identity/biometric/exact-lookalike rejection, bounds, languageCode required); only trait-extraction receives image; coverage 95/90/95/95 on touched modules |
| 3 — Game analyze pipeline | `analyze-request.dto.ts` accepts `languageCode` (invalid → normalized default); `analyze-game.use-case.ts` + `analyze-game-stream.use-case.ts` thread language through all three prompts; result-aggregation enforces the v2 shape, server-enforced localized disclaimer/fallback constants, `MAX_FINAL_RESULTS` 4 → 5 bumped here together with its consumers (`result-aggregation.helpers.ts`, `game-result.schema.ts`) and their tests. Image wipe-in-`finally` proofs re-run for success + each prompt-failure path. | 2 | Use-case + aggregation tests green incl. wipe-in-finally on all paths; max-5 cap + forbidden-wording guard verified; e2e-parity for stream path |
| 4 — Translation endpoint | `POST /api/v1/game/translate-result` in `game.controller.ts` + translation use-case: strict DTO (rejects unknown keys, rejects files, bounded payload size), rate-limited via existing throttler, calls Prompt 4 text-only, then server-side overwrite guarantees names/scores/ranks unchanged; disclaimer/fallback replaced by server-enforced localized constants. Tests prove no call to trait extraction, candidate generation, or judge, and no image accepted. | 1, 2 | Endpoint tests green (preserve names/scores/ranks, oversized-payload rejection, rate limit, no re-analysis); coverage threshold met |
| 5 — Frontend v2 result UI + translate-on-switch | New accessible `Accordion` in ui-primitives (aria-expanded/aria-controls/keyboard, lazy rendering of panels); game gateway/service/hooks/mappers consume v2 shape; compact-summary chips + trait count; grouped detailed-traits accordion; image-quality & uncertainty section; top-5 result cards (confidence, country, category, mismatch warnings); localized disclaimer; locale-switch triggers translate endpoint with loading state, failure keeps old result visible; en/ar messages; RTL logical spacing, dark mode, mobile-first (320–414px), reduced motion; no image persistence, object URLs revoked. | 3, 4 | Component/hook/service tests green (translate flow does not re-upload/re-analyze; names/scores preserved; a11y checks); lint 0/0; no forbidden wording in UI copy |
| 6 — E2E + docs + gate sweep | Playwright: full en + ar happy paths (mocked Gemini), language switch after result, invalid image, invalid-JSON and unsafe-output handling, 375px mobile, RTL, PWA + a11y smoke. Docs: README "How it works" (remove "15 traits"/"max 4 results" wording), `docs/architecture.md`, `docs/ai-safety.md`, `docs/privacy-and-data-retention.md`, `TEST_CASES.md`, `context/architecture-map.md`, `memory/` decisions. Full gate run: `npm run validate`, `test:coverage`, `quality:dead-code` (knip), `quality:circular` (madge), `security:scan` (trivy). | 3, 4, 5 | All commands green or documented environment blocker (e2e/browser constraints); docs shipped in same stream |

## Branch / Merge Strategy

Repo convention (single-owner repo, see recent history): work lands on `main` as one conventional commit per milestone slice, e.g. `feat(shared): advanced-global-traits-v2 contracts`, `feat(api): advanced trait extraction pipeline`, `feat(api): translate-result endpoint`, `feat(web): v2 result UI + translate-on-switch`. Husky pre-commit/pre-push hooks run the authoritative gates on every commit; no `--no-verify`, no inline ESLint suppression, ever. Reviewability is preserved by slice size (each milestone is a self-contained, independently green commit) and by tests-first ordering inside each slice. WIP/debug commits never land on `main`.

## Contract Evolution Plan

All contract truth lives in `packages/shared` (Zod strict objects + `as const` constants). The `/api/v1` response envelope is unchanged; payload evolution is versioned by the `promptVersion: 'advanced-global-traits-v2'` literal. There are no DB migrations in this repository (stateless, no persistence).

1. Additive: new v2 schemas/constants land in `packages/shared` with no consumer switched (Milestone 1). Old 15-trait schema remains until Milestone 3 cuts over, then is removed in the same slice as its last consumer (knip enforces no dead schema survives).
2. Producer + consumer cut over atomically per slice: prompts/services (Milestone 2), then analyze DTO/use-case/aggregation including `MAX_FINAL_RESULTS` 4 → 5 with both `result-aggregation.helpers.ts` and `game-result.schema.ts` plus tests in one commit (Milestone 3) — never bump the cap separately from its enforcers.
3. Additive new route: `POST /api/v1/game/translate-result` (Milestone 4) — new endpoint, no existing contract touched.
4. Web client adopts the v2 shape (Milestone 5). API and web ship from the same commit, so no cross-version client window exists; `languageCode` is optional-with-default on the DTO, so a request without it still succeeds.

## Rollout Sequence

1. Local: full gate suite green (`npm run validate`, coverage, ai/file-security/pwa suites, knip, madge, trivy) on the final slice.
2. Docker smoke (where configured): `docker:rebuild` + `docker:up`, run analyze happy path (en + ar) and translate-result against the container; verify logs contain metadata only (no image bytes, no raw prompts/responses).
3. Production: deploy API + web together (single monorepo release). The product is stateless and anonymous — an in-flight game session interrupted by the cutover simply retries; no data to migrate, no cache to warm, no tenant staging needed.
4. Post-deploy smoke: one real analyze in en, locale switch to ar via translate-result, confirm disclaimer present, results ≤ 5, no forbidden wording, image-wipe log markers present, rate limit responding on the translate route.

## Rollback Sequence

1. Triggers: forbidden wording appearing in any served output; safety-filter regression; `AiResponseInvalid` error-rate spike (model returning invalid/oversized/mixed-language JSON beyond the fallback chain's tolerance); translation endpoint mutating scores/ranks; any gate found red post-hoc.
2. Rollback step: `git revert` the slice commits in reverse milestone order (6 → 1, or only the offending slice if later slices don't depend on it) and redeploy API + web together. No data migrations exist — no schema/state to unwind.
3. Validation after rollback: analyze happy path returns pre-v2 behavior (15 flat traits, max 4 results), `promptVersion` in payloads confirms the old pipeline is serving, gates green on the reverted tree, logs clean.

## Feature Flag and Compatibility Notes

No feature flag is used — accepted by Ihab. Rationale: the game is stateless, anonymous, and single-audience (no tenants, no accounts, no gradual-rollout infrastructure), and a flag would require maintaining two parallel prompt/schema/safety surfaces on safety-critical code, doubling the forbidden-wording review surface. Versioning is carried by the `promptVersion: 'advanced-global-traits-v2'` literal in every AI payload plus the atomic API+web deploy, which together make served behavior unambiguous and rollback a clean commit revert. Compatibility notes: the translate-result route is purely additive; `languageCode` defaults server-side when missing/invalid, so no client can break the DTO; disclaimer and fallback are server-enforced localized constants, so no model output (including translations) can weaken them. No dual-write or read-after-write concerns exist (no persistence). Sunset: the old 15-trait schema and `MAX_FINAL_RESULTS = 4` are deleted in the same slices that end their last use — nothing is left to retire later.

## Exit Checklist

- [x] Milestones defined (6 slices, tests-first, each independently green)
- [x] Merge strategy documented (conventional commit per slice on `main`, Husky gates, no bypass)
- [x] Contract evolution order defined (additive shared → atomic producer/consumer cutovers → additive route)
- [x] Rollout order defined (local gates → docker smoke → atomic API+web deploy → post-deploy smoke)
- [x] Rollback order defined (revert slices in reverse, redeploy, verify pre-v2 behavior; no migrations)

## Evidence And References To Attach

- Source spec: `D:/Freelance/TwinzyV2.md` (full trait-field inventory, prompt contracts, test matrix)
- Sibling artifacts: `docs/features/advanced-global-traits-v2/00-intake.md` through `06-technical-refinement.md` (TWZ-V2-001)
- Prompt resources: `apps/api/src/modules/ai/prompts/use-1st-prompt.md`, `use-2nd-prompt.md`, `use-3rd-prompt.md` (+ new `translate-result-prompt.md`)
- Cap + schema anchors: `packages/shared/src/constants/trait.constants.ts` (`MAX_FINAL_RESULTS`), `packages/shared/src/schemas/game-result.schema.ts`, `packages/shared/src/constants/safety.constants.ts`
- Pipeline anchors: `apps/api/src/modules/game/application/analyze-game.use-case.ts`, `apps/api/src/modules/game/application/analyze-game-stream.use-case.ts`, `apps/api/src/modules/game/api/game.controller.ts`, `apps/api/src/modules/result-aggregation/lib/result-aggregation.helpers.ts`
- Gate commands: `npm run validate`, `npm run test:coverage`, `npm run test:ai`, `npm run test:file-security`, `npm run quality:dead-code`, `npm run quality:circular`, `npm run security:scan`

## Phase Blockers

Do not close this phase if:

- implementation slices are too large to review safely — mitigated: 6 bounded slices, largest (Milestone 5) is confined to `apps/web` game feature + one ui-primitive
- contract evolution order is still unclear — resolved: additive-first, cap bump atomic with enforcers, route additive
- rollback order is missing for risky changes — resolved: commit-revert per slice, no migrations, `promptVersion` makes served pipeline observable
- the roadmap cannot be followed step by step — resolved: each milestone lists dependencies and merge criteria; no slice starts before its dependencies are merged green

Status: no open blockers. Phase 07 closed by Ihab, 2026-07-07.
