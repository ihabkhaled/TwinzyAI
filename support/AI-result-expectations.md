---
id: support-ai-result-expectations
title: AI Result Expectations — What Results Are and Are Not
type: support
authority: canonical
status: current
owner: repository owner
summary: What a Twinzy result actually claims (playful style/vibe fit from written traits), what it never claims (identity, biometrics, sensitive attributes), and how to answer players who misread it.
keywords: [support, ai, results, disclaimer, identity, biometrics, safety, scores, fallback, expectations]
contextTier: 2
relatedCode:
  [
    apps/api/src/modules/result-aggregation/lib/result-aggregation.mapper.ts,
    apps/api/src/modules/ai/application/ai-safety.service.ts,
    packages/shared/src/constants/safety.constants.ts,
  ]
relatedTests: [apps/api/src/modules/ai/tests/ai-safety.service.test.ts]
relatedDocs: [docs/ai-safety.md, support/escalation-matrix.md, release-notes/twinzy-hardening-v3.md]
readWhen: A player asks what their result means, disputes a score, or reads the result as identity/face matching.
---

# AI Result Expectations — What Results Are and Are Not

## What a result IS

- A **playful style/vibe fit** between the player's *written visible traits* (hair, eyes, face shape, grooming, vibe words) and public figures. Only trait extraction ever sees the photo; candidate generation, judging, translation, sharing, and display are text-only (`docs/ai-safety.md`, CLAUDE.md Twinzy constraints).
- The score is "a playful style/vibe fit estimate from written traits, not facial similarity" (`result.scoreExplanation`, `apps/web/src/packages/i18n/messages/en.json`). Since hardening v3, scores are calibrated so 90+ is rare (`release-notes/twinzy-hardening-v3.md`).
- Every result carries the server-enforced disclaimer — the model's own disclaimer text is never trusted; the backend overwrites it with the canonical localized copy (`apps/api/src/modules/result-aggregation/lib/result-aggregation.mapper.ts`): *"This is a playful style/vibe result based on written visible traits only. It is not face recognition, identity matching, or biometric comparison."*
- Results include uncertainty honestly: image-quality notes, unclear categories, low-confidence observations (`result.uncertainty.*`).
- **"No confident match this time"** (`result.fallbackTitle`) is a designed outcome when nothing clears the display threshold (`apps/api/src/modules/result-aggregation/lib/result-aggregation.helpers.ts`) — not a failure.

## What a result is NOT (never claim otherwise)

- **Not identification.** The app never determines or guesses WHO the player is, and no exact-lookalike assertion may appear.
- **Not biometric.** No face templates, embeddings, or facial-similarity measurement exist anywhere in the pipeline.
- **No sensitive inference.** No ethnicity/religion/health/sexuality/personality/attractiveness/income judgments — ever. Visible descriptors (e.g. skin tone impression) are fine; claims about what a person IS are not.
- **Not deterministic.** Runs on the same photo may produce different candidate sets and orderings; that is expected model behavior, not a defect.
- **Not for serious use.** Terms copy: results are playful guesses, can be wrong, and must not be used for identity checks, hiring, or dating decisions (`terms.*` in `en.json`).

## How the guarantees are enforced (for confident support answers)

Every AI response is Zod-validated and then swept for forbidden wording (identity assertions, sensitive topics, clinical biometric phrasing) before use; unsafe items are rejected or dropped (`apps/api/src/modules/ai/application/ai-safety.service.ts` over the shared lists in `packages/shared/src/constants/safety.constants.ts`). Shared results are re-scanned at share time (`apps/api/src/modules/share-results/application/share-result-safety.service.ts`).

## Support rules

1. Never soften or contradict the disclaimer when answering players.
2. If a player reports wording that *sounds like* identity/biometric matching, treat it as a **SEV-1 safety escalation** — capture the exact wording and escalate per [escalation-matrix.md](./escalation-matrix.md); it is never a ticket wording debate (`support/README.md`).
3. Score disputes: explain calibration and the text-only pipeline; do not promise different results.
4. "No match" complaints: suggest a clearer, well-lit photo (`help.a5`); never suggest bypassing any check.
