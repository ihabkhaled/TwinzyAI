# Technical Refinement

## Current owners

`TraitExtractionService` owns image input; `CandidateRecallService` owns recall strategy; `AiRouterService` and `ProviderRegistryService` own provider routing; `StyleMatchService` owns text-only matching; `ResultAggregationService` owns public result assembly; game module owns the result/share UI.

## Chosen approach

Extend the shared extraction response with a bounded matching profile and counterfactuals. Introduce a `public-figures` module whose catalog repository is bounded/read-only and whose external adapters accept entity IDs, not URLs. Add ensemble application services using existing provider ports and the global concurrency gate. Keep orchestration in a use case/helper using `Promise.allSettled`; keep scoring pure and deterministic.

## Alternatives

- Open-ended model-only recall: rejected because entities and evidence are unverifiable.
- One large agent loop: rejected because latency/cost/failure bounds are unclear.
- Browser crawler: rejected for SSRF, licensing, reliability, and privacy risk.
- Image-based public-figure search: rejected by permanent product policy.

## Formula

Use median participant evidence: 45% stable structure, 20% hair/facial hair, 10% eyewear/accessories, 10% expression/presentation, 5% grooming/style, and 10% cross-model/cross-lane agreement. Add bounded retrieval bonuses and subtract named contradiction, uncertainty, generic-trait, unsupported-claim, disagreement, unresolved-entity, duplicate, occlusion, and quality penalties. Constants own all thresholds.

