---
id: structure-module-api-result-aggregation
title: Module — api result-aggregation (Final Response Shaping)
type: structure
authority: canonical
status: current
owner: repository owner
summary: The pure final-response shaping module — displayability filtering, re-ranking, capping, and server-owned disclaimer/fallback enforcement over judged results.
keywords: [result-aggregation, aggregation, ranking, disclaimer, fallback, displayable, verdict, score]
contextTier: 2
relatedCode: [apps/api/src/modules/result-aggregation]
relatedTests: [apps/api/src/modules/result-aggregation/tests]
relatedDocs: [structure/flows/analyze-flow.md, structure/modules/shared.md]
readWhen: You are changing what results are shown, their ranking, or the disclaimer/fallback copy.
---

# Module — `apps/api/src/modules/result-aggregation`

**Responsibility.** Pure final-response shaping between the judge output and the public
`FinalGameResult`. No controller, no adapters, no env keys; consumed by the game module's
`StyleMatchService` ([flows/analyze-flow.md](../flows/analyze-flow.md) step 11).

## Public surface (`index.ts`)

`ResultAggregationService`, `ResultAggregationModule`.

## Key files

| File | Role |
| --- | --- |
| `application/result-aggregation.service.ts` | `aggregate(extraction, judgeResponse, languageCode, resultCount)` and `buildFallback(...)` — keeps only displayable results, caps + re-ranks, enforces the server-side localized disclaimer, drops the judge's `removedCandidates` from the public payload |
| `lib/result-aggregation.helpers.ts` | `isDisplayableResult` (`shouldDisplay` && verdict ≠ `Weak` && score ≥ shared `MIN_DISPLAY_SCORE` && `safetyCheck.meetsMinimumEvidence`), `selectDisplayableResults` (filter → sort desc → slice; pure) |
| `lib/result-aggregation.mapper.ts` | `toFinalResultItem` (1-based rank), `toFinalGameResult` (shared `GAME_PROMPT_VERSION` + `RESULT_DISCLAIMER_BY_LANGUAGE`; the model's own disclaimer is never trusted), `toFallbackResult` (shared `NO_MATCH_FALLBACK_BY_LANGUAGE`) |
| `model/result-aggregation.constants.ts` | Log context |

## Invariants

- Pure text-in/text-out: no env reads, no external calls, no image anywhere near this module.
- Display thresholds and localized copy are **shared** constants
  (`packages/shared/src/constants/trait.constants.ts`, `app.constants.ts`) — change them
  there, not locally ([shared.md](shared.md)).
- The output must satisfy the strict `FinalGameResultSchema` (results ≤ resultCount;
  fallbackMessage required when results are empty —
  `packages/shared/src/schemas/game-result.schema.ts`).
- `removedCandidates` (judge-internal) never reach the public payload.

## Tests

`apps/api/src/modules/result-aggregation/tests/` — helpers, mapper, and service suites.
Covered end-to-end by `apps/api/src/tests/game-analyze.integration.test.ts`. Scoped run:
`npm run test:ai`.

## Common changes and risks

- **Threshold changes** (`MIN_DISPLAY_SCORE`, verdict rules): shared-constant change +
  helper test updates; product-visible, so cover in the game integration tests too.
- **Disclaimer/fallback copy**: `RESULT_DISCLAIMER_BY_LANGUAGE` /
  `NO_MATCH_FALLBACK_BY_LANGUAGE` in `@twinzy/shared` (en + ar together).
- **Risk**: relaxing displayability or trusting model-supplied disclaimers breaks the safety
  posture recorded in [docs/ai-safety.md](../../docs/ai-safety.md).
