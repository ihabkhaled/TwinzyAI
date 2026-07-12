---
id: product-game-rules
title: Game Rules — Counts, Scores, Verdicts, Disclaimer
type: product
authority: canonical
status: current
owner: repository owner
summary: "The rules of the game: 1–10 results default 10, 0–100 style/vibe fit scores with a 70 display floor, strong/medium/weak verdicts, judge safety flags, and the always-server-enforced disclaimer."
keywords: [game, rules, result-count, score, verdict, disclaimer, judge, candidates, fallback]
contextTier: 2
relatedCode: [packages/shared/src/constants/trait.constants.ts, packages/shared/src/schemas/judge.schema.ts, apps/api/src/modules/result-aggregation/lib/result-aggregation.mapper.ts]
relatedTests: [apps/web/e2e/game-result-count.spec.ts, apps/web/e2e/game-results.a11y.spec.ts]
relatedDocs: [product/terminology.md, docs/ai-safety.md, TEST_CASES.md]
readWhen: You need the authoritative numbers and semantics of results, scores, verdicts, or the disclaimer.
---

# Game Rules — Counts, Scores, Verdicts, Disclaimer

## Input rules

- **One photo per run**, explicit consent required first, backend-verified through the full
  upload security chain ([rules/15-file-upload-security.md](../rules/15-file-upload-security.md),
  behavior matrix in [TEST_CASES.md](../TEST_CASES.md)).
- **Result count is user-selected: 1 to 10, default 10** —
  `MIN_RESULT_COUNT=1`, `MAX_RESULT_COUNT=10`, `DEFAULT_RESULT_COUNT=10` in
  [packages/shared/src/constants/trait.constants.ts](../packages/shared/src/constants/trait.constants.ts),
  enforced by [packages/shared/src/schemas/result-count.schema.ts](../packages/shared/src/schemas/result-count.schema.ts)
  and at the transport edge
  ([apps/api/src/modules/game/api/dto/analyze-request.dto.ts](../apps/api/src/modules/game/api/dto/analyze-request.dto.ts)).
- **Language**: `en` or `ar`, echoed through every AI step
  ([packages/shared/src/schemas/language.schema.ts](../packages/shared/src/schemas/language.schema.ts),
  [docs/ai-safety.md](../docs/ai-safety.md)).

## Matching pipeline rules

- The internal **candidate pool** is 1–25 (`MIN_CANDIDATE_POOL`/`MAX_CANDIDATE_POOL`,
  [packages/shared/src/constants/trait.constants.ts](../packages/shared/src/constants/trait.constants.ts))
  and is always ≥ the requested result count.
- The **judge** (prompt 3,
  [apps/api/src/modules/ai/prompts/use-3rd-prompt.md](../apps/api/src/modules/ai/prompts/use-3rd-prompt.md))
  rescopes each candidate into a `JudgedResult`
  ([packages/shared/src/schemas/judge.schema.ts](../packages/shared/src/schemas/judge.schema.ts)):
  0–100 `finalStyleVibeFitScore`, `strong|medium|weak` verdict
  ([packages/shared/src/enums/verdict.enum.ts](../packages/shared/src/enums/verdict.enum.ts)),
  confidence level, country/region, public category, localized reason, evidence trait arrays,
  mismatch warnings, and an explicit `shouldDisplay` decision.
- Every judged result carries **safety flags that must be literal `false`**
  (`JudgeSafetyCheckSchema`): face-recognition, biometric, identity, exact-lookalike, and
  sensitive-inference claims each fail validation outright.
- **Score calibration** (verdict bands, uncertainty caps, minimum evidence) is deliberately
  owned by the judge prompt file, not mirrored as constants — see the note at the bottom of
  [packages/shared/src/constants/trait.constants.ts](../packages/shared/src/constants/trait.constants.ts).
- Results scoring **below 70 are not displayed** outside explicit debugging
  (`MIN_DISPLAY_SCORE=70`, same file).

## Semantics: what a match means

A match is a **style/vibe fit** against a public figure's written style/vibe, computed from the
written visible traits only — never a claim of identity, lookalike status, or biometric
similarity ([context/product-context.md](../context/product-context.md),
[constraints.md](constraints.md) #4–5). "90+" scores are deliberately rare after the v3 score
calibration ([release-notes/twinzy-hardening-v3.md](../release-notes/twinzy-hardening-v3.md)).

## Output rules (server-authoritative)

Owned by [apps/api/src/modules/result-aggregation/lib/result-aggregation.mapper.ts](../apps/api/src/modules/result-aggregation/lib/result-aggregation.mapper.ts):

- The backend is authoritative for the **display count** (it slices to the requested count) and
  re-ranks results 1-based by ordered position.
- The **disclaimer is always server-enforced**: the fixed localized text from
  `RESULT_DISCLAIMER_BY_LANGUAGE`
  ([packages/shared/src/constants/app.constants.ts](../packages/shared/src/constants/app.constants.ts))
  is attached to every result and fallback; the model's own disclaimer text is never trusted or
  forwarded.
- **Empty results require a fallback message** (schema refinement in
  [packages/shared/src/schemas/judge.schema.ts](../packages/shared/src/schemas/judge.schema.ts));
  the server substitutes its own localized `NO_MATCH_FALLBACK_BY_LANGUAGE` text.
- The judge's `removedCandidates` list never reaches the client.
