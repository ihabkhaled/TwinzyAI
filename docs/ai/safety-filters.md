---
id: ai-safety-filters
title: AI Safety Filters — The Four Layers
type: doc
authority: canonical
status: current
owner: repository owner
summary: The four enforcement layers every AI response passes — shared forbidden lists, the wording guard, AiSafetyService reject/drop policy, and literal-false schema flags.
keywords: [ai, safety, filters, forbidden, wording, guard, layers, rejection, sanitization]
contextTier: 2
relatedCode: [apps/api/src/modules/ai/application/ai-safety.service.ts, apps/api/src/modules/ai/lib/forbidden-wording.guard.ts, packages/shared/src/constants/safety.constants.ts, packages/shared/src/schemas/judge.schema.ts]
relatedTests: [apps/api/src/modules/ai/tests/ai-safety.service.test.ts, apps/api/src/modules/ai/tests/forbidden-wording.guard.test.ts]
relatedDocs: [docs/ai-safety.md, docs/ai/forbidden-wording.md, docs/ai/schema-contracts.md]
readWhen: You are touching any safety filter, or need to know what happens when a model output trips one.
---

# AI Safety Filters — The Four Layers

**Owner:** [docs/ai-safety.md](../ai-safety.md) (implementation summary) with
[rules/14-ai-safety.md](../../rules/14-ai-safety.md) as the normative rule set. This page maps
the enforcement layers and their outcomes; it does not restate the policy.

Every AI response passes all applicable layers before any use:

## Layer 1 — Shared forbidden lists (the vocabulary)

`FORBIDDEN_RESULT_PHRASES` + `FORBIDDEN_SENSITIVE_TOPICS` in
[`packages/shared/src/constants/safety.constants.ts`](../../packages/shared/src/constants/safety.constants.ts)
— English + Arabic, single source for backend rejection and frontend tests. Where they live and
how to change them: [forbidden-wording.md](forbidden-wording.md).

## Layer 2 — The wording guard (the scanner)

[`apps/api/src/modules/ai/lib/forbidden-wording.guard.ts`](../../apps/api/src/modules/ai/lib/forbidden-wording.guard.ts)
— case-insensitive substring scan over `ALL_FORBIDDEN_PHRASES` (the merged lists,
`apps/api/src/modules/ai/model/ai-safety.constants.ts`), plus `findForbiddenPhrase` for
diagnostics.

## Layer 3 — AiSafetyService (the policy: reject vs drop)

[`apps/api/src/modules/ai/application/ai-safety.service.ts`](../../apps/api/src/modules/ai/application/ai-safety.service.ts):

| Response kind | On a hit |
| --- | --- |
| Trait extraction text (every free-text leaf via `lib/trait-text.util.ts`) | **Whole response rejected** — `AI_RESPONSE_UNSAFE`; only the matched phrase is logged |
| Translation text (before AND after translation) | **Whole response rejected** — `AI_RESPONSE_UNSAFE` |
| Candidates | Offending **item dropped**, pipeline degrades gracefully |
| Judged results | Offending **item dropped**; fallback result when nothing safe remains |

`AI_RESPONSE_UNSAFE` is **not** route-hoppable — an unsafe output fails the request rather than
retrying another model ([fallback-routing.md](fallback-routing.md)).

## Layer 4 — Schema-level literal-false safety flags

`z.literal(false)` flags in every response schema (e.g. `JudgeSafetyCheckSchema`,
`packages/shared/src/schemas/judge.schema.ts:34-40`) make a self-reported violation a validation
failure — see [schema-contracts.md](schema-contracts.md).

## Adjacent guards (owned by their own docs)

- Prompt-level forbidden-wording sections in all four prompts —
  [prompt-catalog.md](prompt-catalog.md).
- Language echo guard (`lib/response-language.guard.ts`) —
  [output-validation.md](output-validation.md).
- Server-owned disclaimer/no-match copy (model text never trusted for them) —
  [docs/ai-safety.md](../ai-safety.md); enforced in
  `apps/api/src/modules/result-aggregation/lib/result-aggregation.mapper.ts` and
  `result-translation.service.ts`.
- Aggregation display gate (score ≥ 70, non-weak verdict, `meetsMinimumEvidence`) —
  [pipeline.md](pipeline.md) §4.
