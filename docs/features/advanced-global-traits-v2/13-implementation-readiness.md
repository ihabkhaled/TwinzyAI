# 13 - Implementation Readiness

- Request ID: TWZ-V2-001 — advanced-global-traits-v2
- Date: 2026-07-07
- Owner: Ihab (product + engineering)
- Track: standard (major feature; safety-critical surfaces touched: prompts, shared AI schemas, safety filters)

## Purpose

Prepare the team and the system to implement safely.

## Step-by-Step Workflow

1. Confirm phases `00` through `12` are complete enough to begin.
2. Prepare branch strategy and change slices.
3. Prepare flags, migrations, rollback, and observability.
4. Prepare test scaffolding and review checklists.
5. Confirm release controls and approvers are ready.

Status: phases 00–12 for TWZ-V2-001 are documented in this folder; source spec `D:\Freelance\TwinzyV2.md` read in full; repo canon read (`CLAUDE.md`, `context/architecture-map.md`, `rules/00-non-negotiable-rules.md`, `rules/14`/`15`/`12`/`13`, existing prompts under `apps/api/src/modules/ai/prompts/`, `analyze-game.use-case.ts`, shared schemas/constants). Affected code and its tests read before change.

## Readiness Checklist

### Delivery Setup

- [x] Branch strategy defined — work on `main` (repo convention), conventional commits per slice via Husky hooks; every commit keeps all gates green (lint 0/0, tsgo typecheck, coverage 95/90/95/95 on touched modules, knip, madge, trivy).
- [x] Work is sliced into reviewable increments:
  1. `packages/shared` — languageCode schema (`en`|`ar`, invalid → default), 16 nested trait-category schemas (221 bounded fields) + uncertaintyNotes (4 bounded arrays) + compactTraitSummary (20–35) + traitCount + safetyCheck; advanced candidate schema (confidenceLevel, globalPopularityLevel, aligned/mismatch arrays); judge result schema (verdict, countryOrRegion, publicCategory, shouldDisplay, removedCandidates, fallback, disclaimer); translate request/response schemas; prompt version constant `advanced-global-traits-v2`; `MAX_FINAL_RESULTS` 4 → 5; verdict/confidence/popularity/public-category `as const` constants; forbidden-wording constants extended. All Zod `.strict()`, bounded arrays, max string lengths, no `enum` keyword, no inline definitions.
  2. Prompt upgrades — `use-1st-prompt.md` (221-field extraction, localized "unclear", target 100+ traits), `use-2nd-prompt.md` (5 global candidates, conservative scoring, 90+ rare), `use-3rd-prompt.md` (strict judge, penalize overconfidence/unclear, mandatory localized disclaimer), new `translate-result-prompt.md` (text-only translation, names/scores/ranks untouched) + prompt-template repository registration.
  3. Backend pipeline — analyze DTO gains `languageCode` (normalized to default when invalid); trait-extraction / candidate-generation / candidate-judge services pass languageCode; ai-safety forbidden-wording guard covers every new text field; result aggregation enforces max 5, score bounds, server-enforced localized disclaimer/fallback constants. Image stays memory-only, wiped in `finally`; only trait extraction sees it.
  4. Translation endpoint — `POST /api/v1/game/translate-result` (controller + use case + Prompt 4), rate-limited via a `TRANSLATE_THROTTLE` constant in `game.model/game.constants.ts` (pattern of existing `ANALYZE_THROTTLE`, 10/60s), strict DTO rejects unknown keys and any file part, oversized payload rejected, server-side overwrite of names/scores/ranks after translation.
  5. Frontend plumbing — gateway/service/hooks send active next-intl locale as `languageCode` in the multipart analyze request; canonical structured result kept in state; locale change with existing result calls translate endpoint (never re-uploads/re-analyzes); failure keeps old result with localized error.
  6. Frontend UI — new ui-primitives `Accordion` (aria-expanded/aria-controls/keyboard), compact summary chips + trait count, grouped detailed-traits accordion (lazy rendering), image-quality & uncertainty section, top-5 result cards (confidence, country/region, category, mismatch warnings), localized disclaimer, fallback for <5, translation loading state; RTL/dark-mode/mobile-first (320–414px) preserved.
  7. Docs + test cases — README "How it works" (100+ traits, up to 5 results, localized output, translate-without-re-analysis), architecture/ai-safety/privacy docs, `TEST_CASES.md`, memory/known-pitfalls.
- [x] Owners are assigned — Ihab owns all slices, review, and release.

### Flags and Configuration

- [x] Feature flag plan documented — no runtime flag. The change ships atomically; the AI contract is versioned by `promptVersion: 'advanced-global-traits-v2'`, so payload provenance is always identifiable. Rollback is commit revert, not a toggle.
- [x] Env/config changes identified — none required. `GEMINI_MODEL` + `GEMINI_FALLBACK_MODELS` already exist in `.env.example` and stay env-driven (never hardcoded); global rate limit (`RATE_LIMIT_TTL_MS`/`RATE_LIMIT_MAX`) unchanged; the translate route throttle is a code constant, not an env var. `.env.example` therefore does not change (if that changes during implementation, sync local `.env` per memory note).
- [x] Secret changes identified — none. Existing `GEMINI_API_KEY` unchanged; no new credentials.

### Contracts and Rollback

- [x] Shared contract changes (`packages/shared`) planned with web-client compatibility — the analyze response is reshaped (nested 221-field traits, compactTraitSummary, traitCount, uncertaintyNotes, up-to-5 results) and a new translate contract is added. API and web are updated in the same delivery stream and deploy together; there are no external API consumers, no stored payloads, and no old clients to support (stateless, no DB), so no dual-shape compatibility window is needed.
- [x] Rollback plan documented — `git revert` of the feature commits + redeploy. No DB, no migrations, no persisted data, no config rollback. `promptVersion` makes v1/v2 responses unambiguous during any revert window.

### Observability

- [x] Log entries identified — structured pino logs, request-id correlated, metadata only: languageCode, traitCount, candidate count, judge-removed count, final result count, model actually used from the fallback chain, per-stage latency, translate-endpoint outcomes. Never log raw prompts, raw Gemini responses, or image bytes (production redaction preserved).
- [x] Error codes / message keys identified — invalid/oversized/mixed-language model JSON → existing `AiResponseInvalid` path after bounded-strict-schema + model-fallback-chain exhaustion; translation failure → dedicated messageKey surfaced by the web client while the previous result stays visible; translate-endpoint payload-too-large and unknown-key rejections → validation messageKeys. All errors are AppError + messageKey; no provider errors leak to clients.
- [x] Log inspection path confirmed — `docker compose logs` / pino JSON, unchanged from current operations.

### Quality and Review

- [x] Test scaffolding ready — planned per 11/12: shared schema tests (accept 221-field payloads; reject unbounded arrays, over-long strings, >5 candidates/results, identity/biometric/exact-lookalike wording); use-case tests (image only to trait extraction; candidate/judge/translate text-only; buffer wiped in `finally` on success and on each prompt-stage failure; languageCode normalization); translate endpoint integration tests (does not call extraction/candidates/judge; preserves names/scores/ranks via server overwrite; rejects files and oversized JSON; rate-limited); frontend tests (locale sent, accordion a11y, top-5 render, <5 fallback, translate loading, failure keeps old result, no storage persistence, RTL); e2e with mocked Gemini (en + ar happy paths, language switch without re-analysis) — noting the known e2e/browser environment constraint from 09/12.
- [x] Review checklist ready — `docs/sdlc/code-review-checklist.md`, `rules/23-review-checklist.md`; safety-critical surfaces (prompts, schemas, safety filters) get the deeper AI-safety review per `rules/14`.
- [x] Gates known: `npm run lint` · `npm run typecheck` · `npm run test:unit` · `npm run test:coverage` · `npm run build` · `npm run security:scan` (plus `test:integration`, `test:e2e`, `test:ai`, `test:file-security`, `quality:dead-code`, `quality:circular` where applicable).

### Release Control

- [x] Rollout strategy documented — single atomic release of API + web from `main` after all gates are green; no staged rollout needed (stateless free game, no accounts, no data migration). Smoke test post-deploy: en and ar analyze flow + language switch + translate endpoint rate limit.
- [x] Release approvers identified — Ihab (technical owner and release owner; solo-maintainer role mapping recorded in the approval workflow).
- [x] Hypercare owner identified — Ihab; watch AiResponseInvalid rate, per-stage latency, translate failure rate, and fallback-chain usage after release.

## Readiness Gaps

| Gap | Owner | Resolution date | Status |
| --- | --- | --- | --- |
| E2E/browser environment constraints may block full Playwright runs locally; if so, record exact blocker and manual validation evidence in 15-dev-validation-report.md | Ihab | during phase 15 | open (accepted, non-blocking for start) |
| Model may emit invalid/oversized/mixed-language JSON at higher rates for the 221-field schema; mitigated by bounded strict schemas + `GEMINI_FALLBACK_MODELS` chain + AiResponseInvalid; live rate confirmed only in hypercare | Ihab | phase 26 | open (mitigated by design) |

## Go / Hold Decision

- Decision: go
- Reason: phases 00–12 documented; invariants unchanged and enforced by design (free game, no DB/auth/payments, image memory-only wiped in `finally`, text-only candidate/judge/translate prompts, `GEMINI_MODEL` from env, Zod + safety-filter on every AI output, no `enum`, no inline defs); no env/secret/migration work; rollback is a plain revert; both open gaps have owners and mitigations and do not block safe implementation start.

## Sign-Off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Technical owner | Ihab | approve | 2026-07-07 |
| Release owner if applicable | Ihab | approve | 2026-07-07 |

## Evidence And References To Attach

- Source spec: `D:\Freelance\TwinzyV2.md`; phase artifacts `00`–`12` in `docs/features/advanced-global-traits-v2/`.
- Branch/config: `main`, conventional commits; `.env.example` lines for `GEMINI_MODEL`, `GEMINI_FALLBACK_MODELS`, `RATE_LIMIT_*` (no changes needed).
- Contract/rollback: `packages/shared/src/constants/trait.constants.ts` (`MAX_FINAL_RESULTS` 4 → 5), `packages/shared/src/schemas/game-result.schema.ts`, prompt version literal `advanced-global-traits-v2`; rollback = revert feature commits (no migrations exist).
- Observability: pino JSON via `docker compose logs`; AppError/messageKey catalog in `apps/api/src/core`.
- Gap owners: both open gaps owned by Ihab (table above).

## Phase Blockers

Do not close this phase if:

- rollout or rollback is still fuzzy — clear: atomic release, revert-only rollback, stateless.
- observability is still undefined — defined: metadata-only structured logs, messageKeys, existing inspection path.
- major readiness gaps have no owners — both gaps owned by Ihab with resolution phases.
- the team would still be improvising once coding starts — not the case: slices, schemas, bounds, endpoints, prompts, tests, and docs scope are enumerated above.

No blocker applies. Phase 13 closed as GO on 2026-07-07 by Ihab.
