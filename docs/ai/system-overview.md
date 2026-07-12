---
id: ai-system-overview
title: AI System Overview
type: doc
authority: canonical
status: current
owner: repository owner
summary: One-page view of the four-step AI pipeline — photo to written traits to candidates to judged results, plus text-only translation.
keywords: [ai, overview, pipeline, extraction, generation, judge, translation, gemini, traits]
contextTier: 2
relatedCode: [apps/api/src/config/gemini-step.constants.ts, apps/api/src/modules/ai/ai.module.ts, apps/api/src/modules/game/application/style-match.service.ts]
relatedTests: [apps/api/src/modules/ai/tests/ai-pipeline.test.ts]
relatedDocs: [docs/ai/pipeline.md, context/ai-context.md, docs/ai-safety.md]
readWhen: You want the whole AI system in one page before drilling into pipeline, routing, or safety docs.
---

# AI System Overview

Twinzy turns one consented photo into playful, text-only public-figure style/vibe matches. The AI
pipeline has **four env-routable steps**, enumerated in
[`apps/api/src/config/gemini-step.constants.ts`](../../apps/api/src/config/gemini-step.constants.ts)
(`GeminiStep = { Extraction, Generation, Judge, Translation }`):

```
photo ──▶ 1. Extraction (ONLY image step) ──▶ written traits JSON
              │  image buffer zero-filled in finally
              ▼
          2. Generation (text-only) ──▶ candidate pool (1..25)
              ▼
          3. Judge (text-only) ──▶ re-scored results (≤10)
              ▼
          Aggregation (no AI call) ──▶ FinalGameResult to the client

language switch: 4. Translation (text-only) — existing result JSON → same-shape localization
```

- **Extraction** is the only step allowed to carry the photo: `AI_IMAGE_STEPS =
  [GeminiStep.Extraction]` (`gemini-step.constants.ts:62`). Ownership of that boundary:
  [written-traits-only-boundary.md](written-traits-only-boundary.md).
- **Generation, Judge, Translation** receive only written evidence — no image URL, hash, crop, or
  embedding. Orchestrated by
  [`apps/api/src/modules/game/application/style-match.service.ts`](../../apps/api/src/modules/game/application/style-match.service.ts)
  ("the TEXT-ONLY matching phase").
- **Aggregation** is deterministic server code, not an AI call
  (`apps/api/src/modules/result-aggregation/`): display gate score ≥ 70, non-weak verdict,
  `meetsMinimumEvidence`, sliced to the requested `resultCount` (1–10).
- **Translation** re-imposes every canonical field (names, ranks, scores, verdicts, enums,
  `promptVersion`) from the original and rejects shape drift
  (`apps/api/src/modules/ai/application/result-translation.service.ts`).
- **Parallel recall (flag-gated, OFF by default).** When `AI_PARALLEL_PIPELINE_ENABLED=true`, the
  Generation step fans out into `AI_GENERATION_LANES` text-only focus lanes bounded by a
  process-global per-step gate and a per-analysis call budget, merged deterministically; the
  flag-off path is one unchanged generation call and the SSE contract and image boundary are
  identical either way — [concurrency-policy.md](concurrency-policy.md),
  [ADR-004](../../architecture/adrs/adr-004-parallel-ai-pipeline.md).

## Cross-cutting guarantees (each owned elsewhere)

| Guarantee | Owner |
| --- | --- |
| Every response Zod-validated before use | [schema-contracts.md](schema-contracts.md), [output-validation.md](output-validation.md) |
| Every response safety-filtered (en+ar forbidden lists, literal-false safety flags) | [docs/ai-safety.md](../ai-safety.md), [safety-filters.md](safety-filters.md) |
| Models/providers chosen only via env (`AI_ROUTE_*`, `GEMINI_MODEL*`) | [docs/provider-routing.md](../provider-routing.md), [model-routing.md](model-routing.md) |
| Photo dies at extraction (wipe-in-`finally`) | [image-lifecycle.md](image-lifecycle.md) |
| Timeouts, byte caps, concurrency, sampling all env-bounded | [retry-timeout-policy.md](retry-timeout-policy.md), [cost-policy.md](cost-policy.md) |

The pipeline is exposed via `POST /api/v1/game/analyze[/stream]`, `cancel`, and
`translate-result` (`apps/api/src/modules/game/api/game.controller.ts`); the streaming variant
emits an SSE progress contract described in [pipeline.md](pipeline.md) §Streaming. The prompt
contract version is `written-traits-v5`
(`packages/shared/src/constants/app.constants.ts:49`), asserted as a Zod literal in every
response schema.
