---
id: ai-docs-readme
title: docs/ai — AI System Knowledge Area
type: doc
authority: canonical
status: current
owner: repository owner
summary: Index and read order for the canonical AI-system docs — pipeline, prompts, providers, routing, safety, validation, operational policies, and change checklists.
keywords: [ai, index, pipeline, prompts, providers, routing, safety, validation, benchmarks, checklists]
contextTier: 2
relatedCode: [apps/api/src/modules/ai, apps/api/src/config/gemini-step.constants.ts]
relatedTests: [apps/api/src/modules/ai/tests/ai-pipeline.test.ts]
relatedDocs: [docs/ai-safety.md, docs/provider-routing.md, docs/ai-benchmarking.md, context/ai-context.md]
readWhen: You need to find the right AI doc — start here before touching anything under apps/api/src/modules/ai.
---

# docs/ai — AI System Knowledge Area

Canonical documentation for Twinzy's AI subsystem (`apps/api/src/modules/ai` plus its config in
`apps/api/src/config`). Each page owns one concern; pages link instead of restating.

## Existing owner docs (this area links to them, never duplicates them)

| Doc | Owns |
| --- | --- |
| [docs/ai-safety.md](../ai-safety.md) | The AI-safety implementation summary (with [rules/14-ai-safety.md](../../rules/14-ai-safety.md) as the normative rule set) |
| [docs/provider-routing.md](../provider-routing.md) | Multi-provider routing detail: architecture, add-a-provider, rollout/rollback |
| [docs/ai-benchmarking.md](../ai-benchmarking.md) | The `ai:benchmark` harness: modes, metrics, guardrails |
| [context/ai-context.md](../../context/ai-context.md) | Compact AI context loaded by agents before AI work |

## Read order by task

- **Orient**: [system-overview.md](system-overview.md) → [pipeline.md](pipeline.md)
- **Prompts**: [prompt-catalog.md](prompt-catalog.md) → [prompt-change-checklist.md](prompt-change-checklist.md)
- **Providers / models**: [provider-catalog.md](provider-catalog.md) → [model-routing.md](model-routing.md) →
  [fallback-routing.md](fallback-routing.md) → [shadow-routing.md](shadow-routing.md) →
  [provider-change-checklist.md](provider-change-checklist.md) / [model-change-checklist.md](model-change-checklist.md)
- **Safety & privacy**: [written-traits-only-boundary.md](written-traits-only-boundary.md) →
  [image-lifecycle.md](image-lifecycle.md) → [safety-filters.md](safety-filters.md) →
  [forbidden-wording.md](forbidden-wording.md) → [prompt-injection-threat-model.md](prompt-injection-threat-model.md)
- **Contracts & validation**: [schema-contracts.md](schema-contracts.md) → [output-validation.md](output-validation.md)
- **Operations**: [retry-timeout-policy.md](retry-timeout-policy.md) → [concurrency-policy.md](concurrency-policy.md) →
  [cost-policy.md](cost-policy.md) → [latency-budget.md](latency-budget.md) → [incident-response.md](incident-response.md)
- **Quality & evaluation**: [evaluation-framework.md](evaluation-framework.md) →
  [benchmark-methodology.md](benchmark-methodology.md) → [golden-dataset-policy.md](golden-dataset-policy.md) →
  [regression-evaluation.md](regression-evaluation.md)

## Non-negotiables that shape every page here

Owned by `CLAUDE.md` (Twinzy Product Constraints) and verified in code: consent-first, image in
request memory only and wiped in `finally`, only trait extraction sees the photo, text-only
downstream, no identity or sensitive inference, every AI response Zod-validated and
safety-filtered, models and caps env-driven. See
[written-traits-only-boundary.md](written-traits-only-boundary.md) for the load-bearing boundary.
