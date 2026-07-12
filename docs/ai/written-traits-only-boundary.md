---
id: ai-written-traits-only-boundary
title: The Written-Traits-Only Boundary
type: doc
authority: canonical
status: current
owner: repository owner
summary: Only trait extraction ever sees the photo; every downstream AI step, share, and display is text-only — enforced by types, config, registry, and wipes.
keywords: [ai, boundary, image, traits, text-only, privacy, extraction, typed-port, fail-closed]
contextTier: 2
relatedCode: [apps/api/src/modules/ai/model/ai-provider-adapter.types.ts, apps/api/src/config/gemini-step.constants.ts, apps/api/src/modules/ai/adapters/provider-registry.service.ts, apps/api/src/modules/game/application/style-match.service.ts]
relatedTests: [apps/api/src/modules/ai/tests/ai-pipeline.test.ts, apps/api/src/tests/game-analyze-stream.integration.test.ts]
relatedDocs: [docs/ai/image-lifecycle.md, docs/ai-safety.md, docs/privacy-and-data-retention.md]
readWhen: Before ANY change that touches what data flows between pipeline steps — this is the product's load-bearing privacy boundary.
---

# The Written-Traits-Only Boundary

Twinzy's core privacy promise (`CLAUDE.md`, Twinzy constraints #2–#4): **only trait extraction
may receive the photo; candidate generation, judging, translation, sharing, and display are
text-only.** Downstream stages receive no image URL, hash, crop, embedding, or raw metadata —
only written visible-trait text. This page cites every mechanism that enforces it.

## Enforcement mechanisms (defense in depth)

1. **Typed port.** The provider port
   [`ai-provider-adapter.types.ts`](../../apps/api/src/modules/ai/model/ai-provider-adapter.types.ts)
   separates `generateFromImage[Stream]` (image parameter) from `generateFromText[Stream]`
   (no image parameter at all) — leaking an image into a text step is a **compile error**, not a
   runtime check.
2. **Single image caller.** The only production caller of `generateFromImageStream` is
   [`trait-extraction.service.ts`](../../apps/api/src/modules/ai/application/trait-extraction.service.ts)
   ("The ONLY pipeline step allowed to send the image to the AI provider"); the only builders of
   `AiImageInput` are the two game use-cases feeding it (verified by grep of
   `buildAiImageInput`/`generateFromImage` across `apps/api/src`:
   `analyze-game.use-case.ts`, `analyze-game-stream.use-case.ts`,
   `lib/image-input.util.ts`, plus the benchmark runner and tests).
3. **Config-level step list.** `AI_IMAGE_STEPS = [GeminiStep.Extraction]`
   (`apps/api/src/config/gemini-step.constants.ts:62`) — generation, judge, and translation are
   "text-only by construction" (same file's doc comment).
4. **Fail-closed registry.** Even for extraction, a photo can only dispatch to Gemini
   (`provider-registry.service.ts:82`); no env can widen this —
   [model-routing.md](model-routing.md).
5. **Text-only orchestration.** After extraction returns,
   [`style-match.service.ts`](../../apps/api/src/modules/game/application/style-match.service.ts)
   receives only the extraction JSON ("By the time this runs the image is destroyed"); the
   generation/judge prompt input is `buildMatchingEvidence(extraction)` — a Pick of trait text
   (`apps/api/src/modules/ai/lib/matching-evidence.util.ts`).
6. **Buffer destruction.** The upload buffer is zero-filled in `finally` on success, failure,
   and abort in both use-cases — lifecycle owned by [image-lifecycle.md](image-lifecycle.md).
7. **No image on the wire out.** The SSE `traits` frame carries only `traitCount` +
   `compactTraitSummary`; `translate-result.schema.ts` and the share/display paths have no image
   field (strictObject contracts — [schema-contracts.md](schema-contracts.md)).
8. **No image in shadow runs.** Shadow routing has no extraction key and triggers only after
   text calls — [shadow-routing.md](shadow-routing.md).
9. **Parallel recall stays text-only.** When `AI_PARALLEL_PIPELINE_ENABLED=true`, the extra
   candidate-recall lanes are all text-only generation calls (`generateFromText`, no image
   parameter) fanned out by `CandidateRecallService` after extraction has returned and the buffer
   is wiped; parallelism adds provider calls but never a new image path — extraction remains the
   single image caller ([concurrency-policy.md](concurrency-policy.md)).

## What downstream steps DO receive

Written evidence only: the 221-field trait values, uncertainty notes, `compactTraitSummary`,
`highSignalTraitTokens`, `weightedTraitEvidence`, `visualArchetypeHints`, `imageQualityCaps`,
`candidateSearchHints` (`model/matching-evidence.types.ts`). Note: that file's comment phrase
"alongside the photo" is recorded stale — the code passes no photo (map-verified drift; the code
is correct).

## If you are about to break this

Don't. Any change that would pass image-derived bytes past extraction contradicts the consent
copy shown to users (`apps/web/src/packages/i18n/messages/en.json:71`) and a product
non-negotiable in `CLAUDE.md`. It requires an owner-recorded policy revision first, plus revised
consent copy in both languages — see [docs/privacy-and-data-retention.md](../privacy-and-data-retention.md).
