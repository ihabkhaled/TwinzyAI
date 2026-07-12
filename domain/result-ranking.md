---
id: domain-result-ranking
title: Result Ranking — How Final Results Are Ordered and Capped
type: domain
authority: canonical
status: current
owner: repository owner
summary: The end-to-end ordering pipeline — generation sort, judge ranks, the server display gate, descending re-sort, resultCount cap, and 1-based re-ranking in the mapper.
keywords: [ranking, ordering, result-count, display-gate, re-rank, slice, judge-rank, fallback, aggregation]
contextTier: 2
relatedCode: [apps/api/src/modules/result-aggregation/lib/result-aggregation.helpers.ts, apps/api/src/modules/result-aggregation/lib/result-aggregation.mapper.ts, packages/shared/src/schemas/judge.schema.ts]
relatedTests: [apps/api/src/modules/result-aggregation/tests/result-aggregation.helpers.test.ts, apps/api/src/modules/result-aggregation/tests/result-aggregation.mapper.test.ts, apps/api/src/modules/result-aggregation/tests/result-aggregation.service.test.ts]
relatedDocs: [domain/calculations.md, domain/invariants.md]
readWhen: You need to know why results appear in a given order, or why fewer results than requested came back.
---

# Result Ranking — How Final Results Are Ordered and Capped

The user asks for `resultCount` results (1–10, default 10 —
`packages/shared/src/constants/trait.constants.ts`). Fewer may come back; **never more**
(schema refine in `packages/shared/src/schemas/game-result.schema.ts`). Scoring semantics are
owned by [calculations.md](calculations.md); this doc owns the ordering mechanics.

## The four ordering passes

### 1. Generation orders its pool

`CandidateGenerationService` sorts the candidate pool by `styleVibeFitScore` descending
before handing it to the judge
(`apps/api/src/modules/ai/application/candidate-generation.service.ts`). Unsafe candidates
were already dropped item-wise by the safety filter.

### 2. The judge assigns ranks — but they are normalized, not trusted

Prompt 3 requires "Rank 1..N strongest to weakest; `rank` values must be sequential starting
at 1" (`apps/api/src/modules/ai/prompts/use-3rd-prompt.md`, line 53). The schema defends
against mangled output with the `normalizeRank` preprocessor
(`packages/shared/src/schemas/judge.schema.ts`), and the judge's rank is ultimately
**overwritten** in pass 4 anyway.

### 3. The server display gate filters

`isDisplayableResult` (`apps/api/src/modules/result-aggregation/lib/result-aggregation.helpers.ts`,
lines 9–13):

- `shouldDisplay` is true (judge's own flag),
- `verdict !== 'weak'`,
- `finalStyleVibeFitScore >= MIN_DISPLAY_SCORE` (70),
- `safetyCheck.meetsMinimumEvidence` is true.

### 4. Re-sort, cap, re-rank

`selectDisplayableResults` (same file, lines 19–26) is pure: filter → `toSorted` by
`finalStyleVibeFitScore` **descending** → `slice(0, resultCount)`. The mapper then assigns the
final 1-based `rank` from array position (`toFinalResultItem`,
`apps/api/src/modules/result-aggregation/lib/result-aggregation.mapper.ts`), so client-visible
ranks are always sequential 1..n regardless of what the judge wrote.

## What the client never sees

- The judge's `removedCandidates` list (with removal reasons) is dropped from the public
  payload (`result-aggregation.mapper.ts`).
- Results failing the display gate simply vanish — there is no "hidden result" indicator.

## Empty outcome

If nothing survives the gate, the response is the fallback result: empty `results`, the
server-owned localized `NO_MATCH_FALLBACK_BY_LANGUAGE` message, and the mandatory disclaimer
(`toFallbackResult` in `result-aggregation.mapper.ts`;
`packages/shared/src/constants/app.constants.ts`). `FinalGameResultSchema` refines that a
fallback message is required exactly when results are empty
(`packages/shared/src/schemas/game-result.schema.ts`).

## Ties

Sorting uses only `b.finalStyleVibeFitScore - a.finalStyleVibeFitScore`
(`result-aggregation.helpers.ts`, line 25); equal scores keep their incoming (judge) order —
`toSorted` is stable per the ECMAScript spec. No secondary tie-break key exists in code.

## Translation preserves ranking

Translating a result never re-orders or re-scores: name order, `rank`,
`finalStyleVibeFitScore`, and `verdict` are re-imposed from the original
(`apps/api/src/modules/ai/application/result-translation.service.ts`, lines 111–139) — see
[language-lifecycle.md](language-lifecycle.md).
