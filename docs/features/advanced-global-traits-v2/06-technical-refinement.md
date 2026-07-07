# 06 - Technical Refinement

- Request ID: TWZ-V2-001
- Feature: advanced-global-traits-v2
- Date: 2026-07-07
- Owner: Ihab (product + engineering)
- Track: standard (safety-critical surfaces touched: prompts, schemas, safety filters)

## Purpose

Select the technical direction for upgrading Twinzy from the 15-flat-trait pipeline to the advanced 221-field / 16-category, multilingual, 5-result pipeline with a translate-without-reanalysis endpoint — after comparing realistic implementation options and trade-offs.

## Step-by-Step Workflow

1. Candidate approaches defined for the four load-bearing decisions: (a) language-switch translation architecture, (b) trait schema shape, (c) localization strategy for dynamic AI output, (d) rendering strategy for 221 trait fields.
2. Each approach evaluated for complexity, security, scalability, cost, latency, reliability, maintainability, and backward compatibility (matrix below).
3. Chosen approach recorded with reasoning; source spec `D:\Freelance\TwinzyV2.md` cross-checked against repo canon (`context/architecture-map.md`, `rules/00-non-negotiable-rules.md`, `rules/14-ai-safety.md`).
4. Rejected approaches and open technical questions recorded with owners.

## Technical Context

Current landscape (read before refinement):

- Backend `apps/api`: NestJS 11 + Fastify, no DB by design, stateless. AI module owns `trait-extraction.service.ts`, `candidate-generation.service.ts`, `candidate-judge.service.ts`, `ai-safety.service.ts`, `gemini.adapter.ts` (only `@google/genai` import; timeout + ordered model fallback chain via `GEMINI_MODEL` / `GEMINI_FALLBACK_MODELS` from typed zod config), `prompt-template.repository.ts` loading `use-1st/2nd/3rd-prompt.md` with placeholder validation (`prompt-version.constants.ts`, currently `PROMPT_VERSION = '1.0.0'`).
- Pipeline today: image → Prompt 1 (traits, 15 flat) → Prompt 2 (candidates, text-only) → Prompt 3 (judge, text-only) → `result-aggregation` (caps at `MAX_FINAL_RESULTS = 4` in `packages/shared/src/constants/trait.constants.ts`, min display score, verdict filter).
- Safety rails already in place and reused as-is: forbidden-wording guard + sanitizer (`modules/ai/lib`), strict Zod schemas in `packages/shared`, file-security chain (consent, single file, size/MIME/extension/magic-bytes/decode, optional ClamAV fail-closed), image memory-only wiped in `finally`, `AppError` + `messageKey` envelope, `@nestjs/throttler` rate limiting.
- Frontend `apps/web`: modules/game anatomy (component → hook → service → gateway), next-intl (en|ar), TanStack Query, ui-preferences module (theme/direction), RTL + dark mode + mobile-first, Playwright/Testing Library.
- Invariants that constrain every option: free game; no payments/accounts/auth/DB; image seen only by trait extraction; candidate/judge/translation prompts text-only; `GEMINI_MODEL` from `.env`; every AI output Zod-validated + safety-filtered; no TS `enum`; no inline definitions; gates lint 0/0, tsgo typecheck, coverage 95/90/95/95 on touched modules, knip, madge, trivy.

## Alternatives Considered

| Option | Description | Pros | Cons |
| --- | --- | --- | --- |
| A (chosen) | Backend translation endpoint `POST /api/v1/game/translate-result` + new text-only Prompt 4; canonical structured result kept client-side and round-tripped; server-side overwrite of names/scores/ranks/verdicts; disclaimer/fallback replaced with server-held localized constants. Trait contract = 16 nested strict Zod category schemas (221 bounded fields) in `packages/shared`; `languageCode` flows through all prompts so the model localizes at generation time. UI renders detail via lazily-rendered accessible Accordion (new ui-primitives component). | No image re-send on locale switch (privacy + cost + latency win); translation surface is text-only, rate-limited, Zod-strict; numeric/name integrity is guaranteed by the server, not the model; nested schemas are readable, testable per category, and bound every string/array; localization needs one model pass per prompt; accordion keeps 221 fields cheap on low-end phones. | One more prompt + endpoint + safety surface to maintain; large (but mechanical) schema surface; canonical result travels in the request body, so the endpoint needs a payload size cap. |
| B (rejected composite) | Frontend-only handling: on locale switch either re-run the full analyze pipeline or translate dynamic strings client-side; keep a flat 221-key trait schema (or a freeform `Record<string,string>`); localize by post-translating English output in a second backend pass. | No new endpoint; flat schema is quick to write; single-language prompts are marginally simpler. | Re-analysis re-sends the image (violates data-minimization intent, doubles Gemini cost, ~3 model calls of latency per switch); client-side translation of AI-generated free text is not feasible with static i18n and would invite a weak hack; flat/freeform schemas are unreadable, unbounded, and gut per-category validation and safety filtering; post-translation doubles model calls on every analyze even when no switch happens. |

## Trade-Off Analysis

| Dimension | Option A | Option B | Selected reasoning |
| --- | --- | --- | --- |
| Simplicity | One new thin endpoint + one text-only prompt; schemas mechanical | No endpoint but scattered client hacks or re-run logic | A is simpler where it matters: one owned surface vs implicit re-analysis paths |
| Maintainability | Per-category schemas, versioned prompt contract `advanced-global-traits-v2` | Flat 221-key schema is a god-object; client translation logic unownable | A |
| Scalability | Stateless; canonical result stays client-side (no-DB invariant intact) | Re-analysis multiplies Gemini load per locale switch | A |
| Performance | Locale switch = 1 text-only call; accordion lazy-renders detail | Locale switch = full 3-call pipeline + image upload | A |
| Security | Image never re-sent; endpoint rejects files, strict DTO, rate-limited, output safety-filtered, server overwrites scores/names/ranks | Image re-transits network on every switch; freeform schema accepts unbounded model output | A |
| Cost | ~1 extra model call only on switch | 3 extra calls per switch, or 2x calls per analyze (post-translation) | A |
| Reliability | Translation failure is non-destructive: frontend keeps old result; model fallback chain reused | Re-analysis can produce different candidates on switch (result instability) | A — determinism of names/scores/ranks is a product requirement |
| Backward compatibility | Additive: contract versioned by `promptVersion: 'advanced-global-traits-v2'`; `languageCode` normalized to default when invalid; `MAX_FINAL_RESULTS` 4→5 is a bounded widening | Breaking UI/state churn on every switch | A |

## Chosen Approach

Option A, end to end:

1. **Prompts**: upgrade `use-1st/2nd/3rd-prompt.md` in place (no duplicate files); add `translate-result-prompt.md`; extend `PromptKey`/`PROMPT_FILES`/`REQUIRED_PLACEHOLDERS` (as-const objects, no `enum`); bump prompt contract to `advanced-global-traits-v2` and add a `[LANGUAGE_CODE]` placeholder. Prompt 1 (image + languageCode) targets 100+ of the 221 visible non-identifying fields across 16 nested categories + `uncertaintyNotes` (4 bounded arrays) + `compactTraitSummary` (20–35) + `traitCount` + `safetyCheck`; unclear fields carry the localized "unclear". Prompt 2 (text-only) returns up to 5 global candidates with confidence/popularity/aligned/mismatch arrays and conservative scoring (90+ rare). Prompt 3 (text-only) strictly rescores, penalizes overconfidence and unclear-image inputs, removes unsafe/weak candidates, and returns up to 5 final results + `removedCandidates` + localized fallback + mandatory disclaimer. Prompt 4 (text-only) translates text fields only.
2. **Shared contracts** (`packages/shared`): per-category strict Zod schemas (bounded string lengths, bounded arrays), candidate/judge/final-result schemas, translation request/response schemas, language-code schema (`en|ar` today, normalized to default when invalid), verdict/confidence/popularity/public-category constants as `as const` + `*_VALUES`; `MAX_FINAL_RESULTS` 4→5. No inline schemas anywhere.
3. **Backend**: `analyze-game.use-case.ts` threads `languageCode` (strict DTO, unknown keys rejected) into all three services; image still touches only trait extraction and is wiped in `finally` on every path. New translate flow: controller route `POST /api/v1/game/translate-result` (throttled, multipart rejected, payload size-capped) → use case → Prompt 4 via the existing Gemini adapter (env model + fallback chain + timeout) → Zod validation → forbidden-wording safety filter → **server-side overwrite** of names, scores, ranks, verdicts, and counts from the canonical input, with disclaimer/fallback swapped for server-enforced localized constants — the model can never mutate them. Result aggregation keeps enforcing max results, score bounds, forbidden wording, mandatory disclaimer regardless of what the judge returned.
4. **Frontend**: compact-summary chips + trait count; grouped detailed traits in a new accessible ui-primitives Accordion (aria-expanded/aria-controls, keyboard, lazy body rendering); image-quality & uncertainty section; top-5 result cards (confidence, country/region, category, mismatch warnings); localized disclaimer; locale-switch hook calls the translate endpoint with loading state, and on failure keeps the previous result visible with a localized error. No image in any storage; object URLs revoked; RTL/dark-mode/mobile-first preserved.
5. **Operational model**: stateless, no migrations, no new infra. Failure modes map to existing `AppError` kinds (invalid model JSON → `AiResponseInvalid` with model fallback chain retried first). Rollback = revert the feature commits; consumers can distinguish payloads by `promptVersion`.

## Rejected Approaches and Why

- **Re-run analyze pipeline on language switch**: re-sends the image (against data-minimization intent), 3x model cost/latency per switch, non-deterministic results across switches.
- **Frontend-only translation of dynamic AI text**: static i18n cannot translate free-form model output; any client hack would be weak and unauditable — explicitly discouraged by the spec.
- **Flat 221-key or freeform `Record<string,string>` trait schema**: unbounded output acceptance, no per-category validation or safety filtering, unmaintainable god-schema.
- **Generate in English then post-translate on every analyze**: doubles model calls for every user even when no switch happens; single-pass localized generation is cheaper and simpler.
- **Trusting the translation model to preserve names/scores/ranks**: prompt instructions alone are not a guarantee; server-side overwrite makes integrity structural.
- **Server-side canonical result cache (DB/Redis) keyed by session**: violates the no-DB/no-persistence invariant for zero benefit; client already holds the canonical result.
- **Virtualized trait list**: unnecessary complexity at ~221 fields split across 16 collapsed groups; accordion lazy rendering suffices — revisit only if profiling shows jank.

## Open Technical Questions

| Question | Owner | Due date | Resolution |
| --- | --- | --- | --- |
| Does the 221-field Prompt 1 output fit the configured Gemini `maxOutputTokens` across the fallback model chain, or do bounds/token config need tuning? | Ihab | 2026-07-09 | pending — validate with `npm run test:ai` + a live smoke against the `.env` model |
| How deep should mixed-language detection go beyond schema/safety validation (heuristic script-range check vs accept-and-sanitize)? | Ihab | 2026-07-09 | pending — start with bounded schemas + forbidden-wording guard; add heuristic only if QA finds mixed output |
| Can Playwright e2e (RTL/Arabic route, PWA smoke) run in this Windows CI/browser environment, or is a documented manual fallback needed? | Ihab | 2026-07-10 | pending — record exact blocker in 15-dev-validation-report if the environment prevents execution |

## Technical Debt Impact

- Debt reduced: prompt contract now versioned (`advanced-global-traits-v2`) instead of an informal `1.0.0` string; every model output field gains explicit bounds; the 15-trait ad hoc shape is replaced by owned per-category schemas; result-count rule centralized in `MAX_FINAL_RESULTS`.
- Debt introduced: a large (though mechanical) schema surface in `packages/shared` to keep in sync with prompt wording; a fourth prompt is one more safety-filter surface; translation endpoint must be kept text-only forever.
- Follow-up required: extend the language-code schema beyond `en|ar` when new locales ship (schema + prompts + localized constants together); monitor Gemini token/latency for the enlarged Prompt 1; revisit accordion virtualization only if low-end-device profiling demands it.

## Exit Checklist

- [x] Alternatives documented
- [x] Trade-offs analyzed
- [x] Chosen approach justified
- [x] Rejected approaches recorded
- [x] Open technical questions assigned (all owned by Ihab with due dates)

## Sign-Off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Technical owner | Ihab | approve | 2026-07-07 |
| Architect if applicable | Ihab (single-owner project; same person, architecture hat) | approve | 2026-07-07 |

## Evidence And References To Attach

- Source spec: `D:\Freelance\TwinzyV2.md` (full prompt shapes, bounds, threat list, acceptance criteria)
- Existing patterns reused: `apps/api/src/modules/ai/adapters/gemini.adapter.ts` (timeout + `GEMINI_FALLBACK_MODELS` chain), `apps/api/src/modules/ai/infrastructure/prompt-template.repository.ts` (placeholder validation), `apps/api/src/modules/ai/lib/forbidden-wording.guard.ts`, `packages/shared/src/schemas/game-result.schema.ts`, `packages/shared/src/constants/trait.constants.ts` (`MAX_FINAL_RESULTS`), `apps/api/src/modules/result-aggregation/lib/result-aggregation.helpers.ts`
- Repo canon consulted: `context/architecture-map.md`, `rules/00-non-negotiable-rules.md`, `rules/14-ai-safety.md`, `rules/15-file-upload-security.md`, `rules/12-i18n.md`, `rules/13-accessibility.md`
- Sibling artifacts: `docs/features/advanced-global-traits-v2/08-architecture-review.md` (boundary/ADR decision) and `11-test-strategy.md` (test mapping) in this folder
- ADRs: contract-version bump + translation endpoint recorded via this artifact and the phase-08 architecture review; no standalone ADR file required (no new architectural style introduced — existing layered pattern extended)

## Phase Blockers

Do not close this phase if:

- only one option was considered when multiple realistic options exist — **not the case**: two composite options and seven rejected variants evaluated above
- trade-offs are hidden behind preferences — **not the case**: eight-dimension matrix recorded
- the chosen approach has no explicit reasoning — **not the case**: reasoning per dimension plus invariant mapping recorded
- open technical questions remain ownerless — **not the case**: all three assigned to Ihab with due dates

No blockers remain; phase 06 is closed as of 2026-07-07.
