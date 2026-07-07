# 08 - Architecture Review

- **Request ID:** TWZ-V2-001 · **Feature:** advanced-global-traits-v2 · **Date:** 2026-07-07 · **Owner:** Ihab · **Track:** standard (major feature, safety-critical surfaces: prompts/schemas)

## Purpose

Verify that the planned solution fits the current architecture or intentionally evolves it with documented decisions.

## Step-by-Step Workflow

1. Re-read architecture canon: `context/architecture-map.md`, `rules/01-architecture.md`, `rules/16-backend-architecture.md`, ADRs `adr-001-strict-engineering-os.md`, `adr-002-zod-validation-vendor.md`, `adr-fe-0001-strict-next-architecture.md` — done 2026-07-07.
2. Compared the V2 pipeline (221-field trait tree, 5 global candidates, strict judge, translate-result endpoint, languageCode plumbing) against the layered anatomy, wrapped-vendor rule, and shared zod contracts — done; findings below.
3. Contract, ownership, data-flow, and topology changes identified — see Architecture Impact.
4. ADR decision recorded — see Required ADRs.

## Current Architecture Context

npm-workspaces monorepo: `apps/api` (NestJS 11 + Fastify, stateless, **no DB by design**), `apps/web` (Next.js App Router, next-intl `en`/`ar`, TanStack Query), `packages/shared` (zod strict schemas, `as const` enums, safety constants — single source of truth for cross-side contracts).

The existing game pipeline this feature upgrades:

- `apps/api/src/modules/game/api/game.controller.ts` → `application/analyze-game.use-case.ts` (plus the SSE variant `analyze-game-stream.use-case.ts`) → `file-security` chain (consent, single file, size/MIME/extension/magic-bytes/decode, optional ClamAV fail-closed) → `modules/ai` three-stage pipeline: `trait-extraction.service.ts` (only stage that sees the image) → `candidate-generation.service.ts` → `candidate-judge.service.ts`, each calling Gemini exclusively through `adapters/gemini.adapter.ts` (`GEMINI_MODEL` from typed config) with prompts loaded via `infrastructure/prompt-template.repository.ts` from `apps/api/src/modules/ai/prompts/use-{1st,2nd,3rd}-prompt.md` → `result-aggregation` module enforcing backend safety caps → response. Image buffer is memory-only and wiped in `finally`; every AI output is zod-validated (`packages/shared/src/schemas/{traits,candidates,judge,game-result}.schema.ts`) and passed through `ai-safety.service.ts` + `forbidden-wording.guard.ts`.
- Frontend: `apps/web/src/modules/game` in strict Component → Hook → Service → Gateway anatomy (`game.gateway.ts` / `game-stream.gateway.ts`), shared primitives in `apps/web/src/packages/ui-primitives`.

All V2 work extends these exact seams; no new module boundary, service, or store is introduced.

## Architecture Impact

| Area | Impact | Notes |
| --- | --- | --- |
| Domain boundaries | None (extended in place) | Same modules: `game`, `ai`, `file-security`, `result-aggregation`, `privacy`. Prompt 4 lives in `ai` (new translation service + `prompts/translate-result-prompt.md` via the existing prompt repository); the translate flow gets its own use-case in `game/application`. No parallel/duplicate modules. |
| Service ownership | Ihab (unchanged, single owner) | New focused services follow the ≤20-line-method rule: translation service in `ai/application`, translate-result use-case in `game/application`, one new thin controller method (one delegation). |
| API contracts | **Changed — versioned** | (1) Analyze response evolves from 15 flat traits to the V2 shape: 221 fields across 16 nested categories + `uncertaintyNotes` (4 bounded arrays) + `compactTraitSummary` (20–35) + `traitCount` + `safetyCheck`, judge results gain `verdict`/`countryOrRegion`/`publicCategory`/`mismatchWarnings`/`judgeNotes`/`shouldDisplay`. (2) New multipart field `languageCode` (`en`\|`ar`; invalid → normalized to default in DTO). (3) New endpoint `POST /api/v1/game/translate-result` (text-only, rate-limited, never accepts a file). (4) `MAX_FINAL_RESULTS` 4 → 5. Contract is versioned by `promptVersion: 'advanced-global-traits-v2'`. Only consumer is our own frontend, shipped in the same monorepo release — lockstep deploy, no external compatibility window needed. |
| Data flow | Extended, invariants intact | Image still enters **only** trait extraction and is wiped in `finally`; candidate/judge/translation prompts remain text-only (traits JSON / candidates JSON / result JSON). New flows: `languageCode` frontend locale → multipart → DTO → all prompts → all responses; translate flow sends the canonical structured result + target language to Prompt 4, then the server **overwrites** names/scores/ranks from the source result and injects server-constant localized disclaimer/fallback — model output can never mutate identity or scoring fields. |
| Event flow | Minimal | No queues/jobs. SSE stream (`analyze-game-stream.use-case.ts`, `game-stream.schema.ts`) keeps its stage-event shape; only terminal payloads grow. Bounded schemas cap payload size. |
| Deployment topology | None | No new deployable unit, no DB, no storage. One new route on the existing Fastify app; `@nestjs/throttler` config extended with a translate-result rate limit. |
| Shared libraries or modules | Significant additive growth | `packages/shared`: 16 nested category schemas + uncertainty/compact-summary schemas, advanced candidate/judge/final-result schemas, translation request/response schema, language-code schema, new `as const` constants (verdict, confidence, popularity, public category, prompt version), extended forbidden-wording coverage for new text fields — all zod `strict()`, bounded arrays/strings, no TS `enum`, no inline definitions. `apps/web/src/packages/ui-primitives`: new accessible Accordion primitive (aria-expanded/aria-controls/keyboard), reused by the game module's grouped-traits UI. |

## Design Pattern Fit

The proposal is a deep behavioral upgrade along existing seams, not an architectural change:

- New AI behavior arrives as prompt resources through the existing `prompt-template.repository.ts` — no new prompt-loading mechanism.
- Gemini stays wrapped: `gemini.adapter.ts` remains the only `@google/genai` import; the translation service reuses the adapter and the existing model fallback chain.
- Contracts stay shared-first: every new shape is defined once in `packages/shared` as a bounded zod strict schema with derived types; no inline schemas in services/controllers.
- Frontend follows `adr-fe-0001` anatomy: translate-on-locale-switch lands in gateway (`game.gateway.ts`) → service → mutation/hook → container; TSX stays composition-only; the Accordion is a shared primitive, not a game-local component; failure-keeps-old-result is hook state, not component logic.
- Result-aggregation keeps its role as the backend safety net (max 5, score bounds, forbidden wording, mandatory localized disclaimer) even though Prompt 3 finalizes — defense in depth preserved.

Intentional deviations from current patterns: none.

## Required ADRs

| ADR needed | Title | Owner | Status |
| --- | --- | --- | --- |
| yes | adr-003-server-side-translate-result-endpoint.md — translate existing results via a text-only Prompt 4 endpoint with server-side overwrite of names/scores/ranks (chosen over client-side translation or re-analysis; guarantees no image re-processing and immutable scoring) | Ihab | pending (write with phase 14) |
| no | Trait-tree expansion, 4→5 results, and languageCode plumbing need no ADR: versioned by `promptVersion`, additive within existing boundaries, covered by adr-001/adr-002 patterns | Ihab | decided |

## Architecture Risks

- Model returns invalid/oversized/mixed-language JSON for the much larger V2 schemas — mitigated by bounded strict schemas (arrays/string lengths capped), the model fallback chain, and `AiResponseInvalid` AppError with messageKey; never partial-parse.
- Translation could mutate scores/names/ranks or add/remove candidates — mitigated structurally: server-side overwrite from the canonical source result; disclaimer/fallback are server-enforced localized constants, never trusted from the model.
- New abuse surface: translate-result accepts user-supplied structured JSON — strict DTO rejects unknown keys, payload size caps, dedicated rate limit, endpoint never accepts multipart/files.
- 221-field payload growth on responses and SSE terminal events — bounded schemas keep size deterministic; frontend renders detailed traits in a lazy accordion to avoid mobile jank.
- Lockstep contract: web and api must release together (analyze response shape changes) — acceptable in a single-repo, single-owner release; rollback is a clean revert of the feature commits (stateless, no DB, no migrations, prompt behavior keyed by `promptVersion`).
- E2E/browser environment constraints may limit full-flow automated evidence on this machine — residual risk tracked in `11-test-strategy.md`; mocked-Gemini integration coverage compensates.

## Exit Checklist

- [x] Architecture docs reviewed (`context/architecture-map.md`, rules 01/16, ADRs 001/002/fe-0001)
- [x] Impact documented (table above)
- [x] Pattern fit documented (no deviations)
- [x] ADR decision made (adr-003 required, pending authoring in phase 14)
- [x] Risks captured

## Sign-Off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Architect / technical owner | Ihab | approve | 2026-07-07 |

## Evidence And References To Attach

- Canon: `context/architecture-map.md`, `rules/01-architecture.md`, `rules/16-backend-architecture.md`, `rules/14-ai-safety.md`
- ADRs: `architecture/adrs/adr-001-strict-engineering-os.md`, `adr-002-zod-validation-vendor.md`, `adr-fe-0001-strict-next-architecture.md`; new `adr-003` to be added
- Source spec: `D:/Freelance/TwinzyV2.md` (full V2 prompt/schema/endpoint requirements)
- Affected boundaries: `apps/api/src/modules/{game,ai,result-aggregation}`, `apps/api/src/modules/ai/prompts/`, `packages/shared/src/{schemas,constants,enums}`, `apps/web/src/modules/game`, `apps/web/src/packages/ui-primitives`
- Related artifacts: `docs/features/advanced-global-traits-v2/09-impact-analysis.md`, `11-test-strategy.md`

## Phase Blockers

Do not close this phase if:

- architecture fit is assumed but not explained — explained above; fit confirmed
- ownership changes are still implicit — none; single owner (Ihab)
- an ADR is needed but was deferred without a decision — decided: adr-003 required, owner Ihab
- cross-boundary effects are still unclear — enumerated in Architecture Impact; none unclear

No blockers remain; phase closed 2026-07-07.
