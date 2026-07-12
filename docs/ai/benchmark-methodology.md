---
id: ai-benchmark-methodology
title: AI Benchmark Methodology
type: doc
authority: canonical
status: current
owner: repository owner
summary: How the ai:benchmark harness measures route entries — modes, per-step flow, metric axes and weights, and its safety guardrails.
keywords: [ai, benchmark, methodology, metrics, weights, mock, real, harness]
contextTier: 2
relatedCode: [apps/api/src/benchmark/benchmark.main.ts, apps/api/src/benchmark/benchmark-real-runner.ts, apps/api/src/benchmark/lib/benchmark-metrics.util.ts, apps/api/src/benchmark/model/benchmark.types.ts]
relatedTests: [apps/api/src/benchmark/tests/benchmark.test.ts]
relatedDocs: [docs/ai-benchmarking.md, docs/ai/evaluation-framework.md, docs/ai/model-change-checklist.md]
readWhen: You are running or modifying the benchmark harness, or interpreting a benchmark report.
---

# AI Benchmark Methodology

**Owner:** [docs/ai-benchmarking.md](../ai-benchmarking.md) — modes, flags, report location,
metric axes, and guardrails are documented there and verified against the code. This page is the
methodology summary for evaluators.

## Invocation

`npm run ai:benchmark` (package.json:73) builds `apps/api` and runs
[`benchmark.main.ts`](../../apps/api/src/benchmark/benchmark.main.ts).

- **Mock mode (default)**: canned per-step responses from
  `apps/api/src/benchmark/benchmark-fixtures.ts` — each step gets a schema-valid, a
  schema-broken, and an unsafe-wording response, so the harness demonstrably measures all three
  axes with zero provider spend.
- **Real mode (`--mode=real`, opt-in)**: prints a billed-calls warning, then
  [`benchmark-real-runner.ts`](../../apps/api/src/benchmark/benchmark-real-runner.ts) measures
  **every enabled usable route entry per step** against live providers. Only extraction receives
  `--photo` (the buffer is zero-filled after encoding, and the image is dropped after the
  extraction step); downstream steps reuse the first schema-valid upstream output, text-only.

Reports: `benchmark-results/run-<mode>-<timestamp>/report.md` + `report.json`.

## Metrics and score

`lib/benchmark-metrics.util.ts` **reuses the production validators** — `buildSchemaValidator`
over each step's shared schema plus `containsForbiddenWording` over every string leaf (skipping
server-owned `disclaimer`/`fallbackMessage`, which the server always overwrites). Weighted
score (`model/benchmark.types.ts:62-69`):

| Axis | Weight | Measures |
| --- | --- | --- |
| Schema validity | 0.5 | Output parses against the production step schema |
| Safety | 0.3 | No forbidden wording in any string leaf |
| Speed | 0.2 | Latency under a 120 s ceiling |

Because the validators are the production ones, a model that scores well here will also survive
the runtime gates ([output-validation.md](output-validation.md),
[safety-filters.md](safety-filters.md)) — the benchmark cannot drift from the pipeline.

## Guardrails

- Mock is the default; real mode is explicit and warned.
- The photo never persists: zero-filled after encode, never passed beyond extraction — same
  invariant as production ([image-lifecycle.md](image-lifecycle.md)).
- Fixtures are self-contained (the build excludes `src/tests/**`), so the benchmark binary
  carries no test-fixture dependencies.

## When to run

Before any model/provider/route change ([model-change-checklist.md](model-change-checklist.md),
[provider-change-checklist.md](provider-change-checklist.md)) and after any prompt or schema
change that could shift validity or safety rates
([prompt-change-checklist.md](prompt-change-checklist.md)).
