---
id: domain-calculations
title: Domain Calculations — Scores, Verdicts, and Caps
type: domain
authority: canonical
status: current
owner: repository owner
summary: The scoring model — styleVibeFitScore rubric, judge verdict banding at 80/70, honesty caps, aggregation thresholds, and derived counts — with each number's owning file.
keywords: [scoring, stylevibefitscore, verdict, banding, honesty-caps, min-display-score, traitcount, calibration, rubric]
contextTier: 2
relatedCode: [apps/api/src/modules/ai/prompts/use-3rd-prompt.md, packages/shared/src/constants/trait.constants.ts, apps/api/src/modules/result-aggregation/lib/result-aggregation.helpers.ts, packages/shared/src/utils/trait-count.util.ts]
relatedTests: [apps/api/src/modules/result-aggregation/tests/result-aggregation.helpers.test.ts, packages/shared/tests/utils.test.ts]
relatedDocs: [domain/result-ranking.md, domain/invariants.md, context/ai-context.md]
readWhen: You need to know where a score, threshold, verdict band, or derived count comes from.
---

# Domain Calculations — Scores, Verdicts, and Caps

**Ownership note:** score **calibration** is deliberately owned by the judge prompt
(`apps/api/src/modules/ai/prompts/use-3rd-prompt.md`) and NOT mirrored into shared constants —
a mirrored copy once drifted (recorded in the closing comment of
`packages/shared/src/constants/trait.constants.ts`). Shared constants own only the hard
**bounds and thresholds** the server enforces.

## styleVibeFitScore (candidate generation, step 2)

- 0–100 integer per candidate (`packages/shared/src/schemas/candidates.schema.ts`;
  `MIN_SCORE`/`MAX_SCORE` in `packages/shared/src/constants/trait.constants.ts`).
- Produced by the shared rubric in `apps/api/src/modules/ai/prompts/use-2nd-prompt.md`: each
  candidate needs ≥3 concrete trait justifications; honesty caps apply (low/very-low image
  quality ⇒ ≤79; few strong features ⇒ ≤74; 90+ requires ≥4 named agreements).
- The generation service ranks its pool by `styleVibeFitScore` descending
  (`apps/api/src/modules/ai/application/candidate-generation.service.ts`).

## finalStyleVibeFitScore and verdict (judge, step 3)

Owned by `apps/api/src/modules/ai/prompts/use-3rd-prompt.md`:

- The judge verifies every claimed agreement against the written evidence, drops unsupported
  claims, and re-scores conservatively (lines 12, 43): "Prefer honest downgrades over keeping
  weak candidates" (line 16).
- Score anchors (lines 64–67): 90–100 = exceptionally strong support with ≥4 named reliable
  agreements and clear image quality ("use rarely; never force it"); 80–89 = strong with some
  real high-weight mismatches; 70–79 = same broad style archetype with partial support;
  50–69 = weak or generic.
- Honesty caps (line 74): many "unclear" fields / heavy uncertainty notes cap every score at
  ≤74.
- **Verdict banding** (line 79): `strong` for 80+, `medium` for 70–79, `weak` below 70
  (values in `packages/shared/src/enums/verdict.enum.ts`).
- `confidenceLevel` anchors (line 77): high = ≥4 evidence-backed high-weight agreements with
  clear quality; medium = 2–3 agreements or moderate quality; low = anything less.
- Display-worthiness per the prompt (line 55): `finalStyleVibeFitScore >= 70` AND
  `safetyCheck.meetsMinimumEvidence: true`.

## Aggregation thresholds (server-enforced, step 4)

`apps/api/src/modules/result-aggregation/lib/result-aggregation.helpers.ts` — the server does
not trust the judge's self-assessment alone:

```
displayable = shouldDisplay
           && verdict !== 'weak'
           && finalStyleVibeFitScore >= MIN_DISPLAY_SCORE   // 70, trait.constants.ts
           && safetyCheck.meetsMinimumEvidence
```

Survivors are re-sorted by `finalStyleVibeFitScore` descending and sliced to the requested
`resultCount` (1–10). Ordering detail: [result-ranking.md](result-ranking.md).

## Derived counts (never model-trusted)

- `traitCount` = `countPopulatedTraitFields(traits)`
  (`packages/shared/src/utils/trait-count.util.ts`): counts observed trait strings across the
  16 categories, skipping `uncertaintyNotes`, non-strings, and values starting with any
  `UNCLEAR_TRAIT_VALUE_MARKERS` entry (bilingual markers in
  `packages/shared/src/constants/trait.constants.ts`). Applied as a schema `.transform` so the
  model's advisory number is always overwritten
  (`packages/shared/src/schemas/traits.schema.ts`).
- `candidateCount` = `candidates.length` via transform
  (`packages/shared/src/schemas/candidates.schema.ts`).

## Pool-size target (generation)

Prompt 2 sizes the candidate pool `[RESULT_COUNT]..25` targeting ≈ `min(max(2N, N+5), 25)`
(`apps/api/src/modules/ai/prompts/use-2nd-prompt.md`); the schema enforces the hard 1–25
bound.

## Share expiry arithmetic

`remainingSeconds = max(0, ceil((expiresAtMs − nowMs) / 1000))` — rounded UP so a record with
0.4 s left still reports 1 and the countdown reaches 0 exactly at expiry
(`apps/api/src/modules/share-results/lib/share-result-expiry.util.ts`, lines 18–19).
