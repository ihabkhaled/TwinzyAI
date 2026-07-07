# 05 - Delivery Plan

- Request ID: TWZ-V2-001
- Feature: advanced-global-traits-v2
- Date: 2026-07-07
- Owner / approver: Ihab (product + engineering)
- Track: standard (major feature; safety-critical surfaces touched: prompts, schemas, AI output handling)

## Purpose

Convert the TWZ-V2-001 request (upgrade Twinzy from 15 flat traits to the advanced 221-field / 16-category multilingual pipeline with up to 5 global results and a translate-result endpoint) into a practical delivery plan with milestones, sequencing, dependencies, and approvals.

## Step-by-Step Workflow

1. Work broken into 8 workstreams (below), all owned by Ihab — solo delivery, so ownership is uniform but sequencing is strict.
2. Sequenced contracts-first: `packages/shared` schemas → prompt templates → backend pipeline → translation endpoint → frontend UI → validation/docs → release. Each milestone lands as reviewable commits with tests in the same slice.
3. Dependencies and blockers identified below; the only external dependency is the Gemini API itself.
4. No feature flag, no staged rollout, no migrations or backfills (stateless, no DB); versioning is carried by `promptVersion: 'advanced-global-traits-v2'`.
5. Owners defined per workstream (all Ihab).

## Delivery Summary

Standard-track delivery in seven sequential milestones. Contracts land first in `packages/shared` (16 nested trait category schemas, uncertaintyNotes, compactTraitSummary, candidate/judge/translation schemas, `languageCode` (en|ar), `MAX_FINAL_RESULTS` 4 → 5, prompt-version and verdict/confidence/popularity/public-category constants). Prompts 1–3 are then upgraded and Prompt 4 (translation-only) added, followed by the backend pipeline (trait extraction → candidates → judge → aggregation, all `languageCode`-aware), the new rate-limited `POST /api/v1/game/translate-result` endpoint, and finally the frontend result experience (compact summary chips, trait count, accessible grouped accordion, image-quality/uncertainty section, top-5 result cards, localized disclaimer, translate-on-locale-switch). Web and API ship together from the same monorepo release, so there is no cross-version compatibility window. Release is a single atomic deploy; rollback is `git revert` of the feature commits — no data migrations exist.

## Work Breakdown

| Workstream | Scope | Owner | Notes |
| --- | --- | --- | --- |
| Backend (`apps/api`) | Upgrade prompt templates 1–3, add `translate-result` prompt 4; update trait-extraction / candidate-generation / candidate-judge services and `analyze-game` use case for `languageCode`; aggregation enforces max 5, score bounds, forbidden-wording guard, server-enforced localized disclaimer/fallback; new `POST /api/v1/game/translate-result` (text-only, rate-limited, server-side overwrite of names/scores/ranks) | Ihab | Image stays memory-only, wiped in `finally`; only Prompt 1 sees it; `GEMINI_MODEL` from `.env` |
| Frontend (`apps/web`) | Send active locale as `languageCode` in analyze request; compact summary chips + trait count; grouped accessible accordion (new `ui-primitives` Accordion with `aria-expanded`/`aria-controls`/keyboard); image-quality & uncertainty section; top-5 result cards (confidence, country/region, category, mismatch warnings); localized disclaimer; translate-on-locale-switch with loading state and failure-keeps-old-result | Ihab | RTL, dark mode, mobile-first (320–414px) preserved; no image persistence in any storage |
| Shared contracts (`packages/shared`) | Strict Zod schemas for all 16 trait categories (221 fields), uncertaintyNotes (4 bounded arrays), compactTraitSummary (20–35), safetyCheck; candidate/judge/final-result/translation request-response schemas; `languageCode` schema; prompt-version, verdict, confidence, popularity, public-category constants (`as const`, no `enum`); bounded arrays and max string lengths everywhere | Ihab | Lands first — both apps compile against it; `MAX_FINAL_RESULTS` 4 → 5 |
| QA | Unit/integration/e2e per `11-test-strategy.md`: schema bound tests, forbidden-wording tests, image-wiped-in-`finally` on every path, translation-preserves-names/scores/ranks, language-switch-does-not-re-analyze, frontend render/a11y/RTL tests, mocked-Gemini e2e in en and ar | Ihab | Coverage gate 95/90/95/95 on touched modules; tests written before implementation per slice |
| Security / privacy | Threat-model additions for the translation endpoint (oversized payload, image smuggled into text endpoint, prompt injection inside trait/candidate text, score/rank mutation by model); rate limit on translate-result; no raw prompt/response/image logging; provider errors never reach client (AppError + messageKey) | Ihab | Server-side overwrite makes score/name mutation by the model harmless by construction |
| Docs | README ("15 traits"/"max 4 results" wording removed), `docs/architecture.md`, AI-safety and privacy docs, `TEST_CASES.md`, `memory/` (pitfalls + AI-safety decisions), this feature's artifact set | Ihab | Same delivery stream as the code |
| Release / ops | Full gate suite (lint 0/0, typecheck, `test:coverage`, build, knip dead-code, madge circular, trivy scan); smoke test with mocked and live Gemini; rollback = revert feature commits | Ihab | Stateless app — no migration/backfill steps in release or rollback |
| Support enablement | Update runbook notes for the new endpoint's failure modes (AiResponseInvalid, rate-limit 429, translation failure keeps prior result) | Ihab | No separate support org — operator notes only |

## Milestones

| Milestone | Goal | Entry criteria | Exit criteria | Target date |
| --- | --- | --- | --- | --- |
| M1 — Shared contracts | All V2 schemas/constants in `packages/shared` | Artifacts 00–13 documented and approved | Schemas merged; lint/typecheck/unit green; no `enum`, no inline definitions; bounds enforced | 2026-07-08 |
| M2 — Prompt upgrades | Prompts 1–3 upgraded, Prompt 4 added, `promptVersion` = `advanced-global-traits-v2` | M1 done | Prompt/schema tests green incl. forbidden-wording rejection and bound violations | 2026-07-09 |
| M3 — Backend pipeline | `languageCode`-aware analyze flow end-to-end against mocked Gemini | M2 done | Image wiped in `finally` on all success/failure paths (tested); candidate/judge receive text only; aggregation caps at 5 with mandatory localized disclaimer/fallback | 2026-07-11 |
| M4 — Translation endpoint | `POST /api/v1/game/translate-result` live behind throttler | M3 done | Endpoint rejects images and oversized payloads; server-side overwrite of names/scores/ranks proven by tests; never calls Prompts 1–3 | 2026-07-12 |
| M5 — Frontend V2 UI | Full result experience + translate-on-locale-switch | M4 done; `ui-primitives` Accordion available | Component/hook tests green; a11y checks pass; RTL/dark/320–414px verified; translation failure keeps old result | 2026-07-15 |
| M6 — Validation & docs | All gates green, docs current | M5 done | `npm run validate` suite green; coverage 95/90/95/95 on touched modules; knip/madge/trivy clean; artifacts 15–19 filled | 2026-07-16 |
| M7 — Release & hypercare | Ship and observe | M6 done; go/no-go GO recorded | 25-release-report + smoke against live Gemini; 26-hypercare window closed healthy | 2026-07-17 |

## Dependencies and Blockers

| Dependency or blocker | Type | Owner | Mitigation |
| --- | --- | --- | --- |
| Gemini API availability and `GEMINI_MODEL` configured in `.env` | External service | Ihab | Model fallback chain; explicit timeouts; AppError with messageKey on failure — never a hang or provider leak |
| Model JSON compliance for the 221-field strict schema (invalid / oversized / mixed-language output) | Technical risk | Ihab | Bounded strict Zod schemas reject bad output; model fallback chain retries; terminal `AiResponseInvalid` error surfaces a localized user-facing failure |
| Translation prompt could mutate scores/ranks/names | Technical risk | Ihab | Server-side overwrite of names/scores/ranks after translation makes mutation impossible by construction; disclaimer/fallback are server-enforced localized constants, not model output |
| New `ui-primitives` Accordion must exist before M5 result UI | Internal sequencing | Ihab | Built as the first M5 slice with its own a11y/keyboard tests |
| E2E/browser environment constraints on the dev machine | Environment | Ihab | Gemini mocked in e2e; if the environment blocks a run, the exact blocker is documented in `15-dev-validation-report.md` rather than skipped silently |
| Artifacts 00–13 must be complete before implementation | Governance gate | Ihab | Sibling artifacts authored in the same delivery stream; hard gate before Phase 14 |

## Rollout Strategy

- Feature flag needed: no — the change ships atomically; the contract is versioned by `promptVersion: 'advanced-global-traits-v2'`, and revert restores the prior pipeline cleanly (stateless, no stored data to reconcile).
- Staged rollout needed: no — single deployment of a free, anonymous, no-tenant app; there is no cohort to stage by.
- Contract change in `packages/shared` needed: yes — new trait/candidate/judge/translation schemas, `languageCode`, `MAX_FINAL_RESULTS` 4 → 5. Web and API deploy together from one monorepo release, so no cross-version compatibility window is required; the web app is the only API consumer.
- Env/config change needed: no new variables — `GEMINI_MODEL` already exists in `.env`; the translate-result rate limit reuses the existing throttler configuration via shared constants.
- Communication plan needed: Not applicable — solo owner, no external stakeholders or client comms (accepted by Ihab).

(There are no database migrations or backfills in this repository — Twinzy has no database.)

## Required Approvals

- [x] Product approval — Ihab, 2026-07-07
- [x] Engineering approval — Ihab, 2026-07-07
- [x] Architecture approval — Ihab, 2026-07-07 (see `08-architecture-review.md`)
- [ ] Security approval — Ihab, at Phase 19 gate (threat model + review of translation endpoint and new AI surfaces)
- [ ] QA approval — Ihab, at Phase 17 gate
- [ ] Release approval — Ihab, at Phase 22 go/no-go
- Client approval: Not applicable — free personal product, no external client or contract (accepted by Ihab)

## Risks

- Gemini returns invalid, oversized, or mixed-language JSON for the 221-field schema — mitigated by bounded strict Zod schemas, the model fallback chain, and a terminal `AiResponseInvalid` error path.
- Translation could mutate scores/ranks/names — mitigated structurally: the server overwrites names/scores/ranks from the canonical result and enforces localized disclaimer/fallback constants.
- Rendering 221 trait fields could jank low-end mobile devices — mitigated by the grouped accordion with lazy rendering of collapsed sections.
- E2E/browser environment constraints may block a full local e2e run — mitigated by mocked-Gemini e2e and explicit blocker documentation if the environment prevents execution.
- Unsafe model wording (identity/biometric/exact-lookalike claims) in any of the new localized fields — mitigated by extending the forbidden-wording guard to every new text field, with rejection or sanitization before display.

## Exit Checklist

- [x] Workstreams identified
- [x] Sequence defined
- [x] Dependencies documented
- [x] Risks documented
- [x] Approval needs documented

## Evidence And References To Attach

- Source spec: `D:\Freelance\TwinzyV2.md` (full V2 requirements, prompts, schemas, acceptance criteria)
- Sibling artifacts: `docs/features/advanced-global-traits-v2/00-intake.md` through `13-implementation-readiness.md` (same delivery stream)
- Gate commands of record: `npm run lint` · `npm run typecheck` · `npm run test:coverage` · `npm run build` · `npm run quality:dead-code` · `npm run quality:circular` · `npm run security:scan`
- Release window: single atomic deploy targeted 2026-07-17; no external coordination required

## Phase Blockers

None open. Sequencing is explicit (M1–M7), every dependency has an owner (Ihab), rollout/rollback is defined (atomic deploy, `git revert`, no migrations), and the path from plan to release is the milestone table above. This phase is closed as of 2026-07-07.
