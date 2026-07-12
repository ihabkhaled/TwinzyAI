---
id: ai-evaluation-framework
title: AI Evaluation Framework
type: doc
authority: canonical
status: current
owner: repository owner
summary: The three evaluation legs — deterministic tests, the ai:benchmark harness, and the live calibrate.mjs quality harness — and when to use each.
keywords: [ai, evaluation, benchmark, calibration, quality, testing, harness, metrics]
contextTier: 2
relatedCode: [apps/api/src/benchmark/benchmark.main.ts, scripts/calibrate.mjs, apps/api/src/benchmark/lib/benchmark-metrics.util.ts]
relatedTests: [apps/api/src/benchmark/tests/benchmark.test.ts, apps/api/src/modules/ai/tests/ai-pipeline.test.ts]
relatedDocs: [docs/ai-benchmarking.md, docs/ai/benchmark-methodology.md, docs/ai/regression-evaluation.md]
readWhen: You need to evaluate model/prompt quality and want to pick the right harness for the question.
---

# AI Evaluation Framework

**Owner of the benchmark harness detail:** [docs/ai-benchmarking.md](../ai-benchmarking.md).
This page maps the three evaluation legs that exist today and what question each answers.

## Leg 1 — Deterministic tests (every commit)

`npm run test:ai` (package.json:52) runs the AI, game, and result-aggregation unit +
integration projects. These pin the *contracts*: schemas, routing/hop behavior, safety
filtering, prompt-template validation, and the prompt↔taxonomy lock-step test
(`apps/api/src/modules/ai/tests/ai-pipeline.test.ts:94`). They use fakes/fixtures, never live
providers ([golden-dataset-policy.md](golden-dataset-policy.md)). Question answered: *did I break
the pipeline's guarantees?*

## Leg 2 — The benchmark harness (`npm run ai:benchmark`)

[`apps/api/src/benchmark/benchmark.main.ts`](../../apps/api/src/benchmark/benchmark.main.ts):
mock mode by default (canned responses, zero spend); `--mode=real` opt-in measures every enabled
usable route entry per step, with only extraction receiving `--photo` (buffer zero-filled after
encode). Scores each entry on three axes with the production validators reused
(`lib/benchmark-metrics.util.ts`): **schema 0.5 / safety 0.3 / speed 0.2** under a 120 s ceiling
(`model/benchmark.types.ts:62-69`). Reports land in
`benchmark-results/run-<mode>-<timestamp>/report.{md,json}`. Question answered: *which
provider:model should serve a step?* Method detail:
[benchmark-methodology.md](benchmark-methodology.md).

## Leg 3 — Live quality calibration (`npm run calibrate`)

[`scripts/calibrate.mjs`](../../scripts/calibrate.mjs) (package.json:74): sends one or more real
photos through a **running** API and prints a quality-focused report per photo — ranked matches
with style/vibe score and confidence, plus optional expected-name recall (`EXPECT` env) and a
rank-1 calibration bar (`TOP_CONF_BAR`, default 90). Env: `API_BASE` (default
`http://localhost:8080`), `RESULT_COUNT` (1..10), `LANG` (en|ar). Per its header, it never writes
the image anywhere — only text results. Question answered: *are the end-to-end results actually
good for real photos?* (This is the "rounds of testing with written conclusions" tool; paste
conclusions into the relevant UAT artifact.)

## Leg 4 — Live traffic (optional)

Sampled, metrics-only shadow runs compare a candidate route on production prompts without user
impact — [shadow-routing.md](shadow-routing.md).

## Choosing

| Question | Use |
| --- | --- |
| Did my change break a contract or safety guarantee? | Leg 1 (`test:ai`) |
| Which model/provider for a step? | Leg 2 (benchmark), then Leg 4 (shadow) before flipping routes |
| Is match quality good on real photos? | Leg 3 (calibrate) |
| Is the new route healthy in production? | Leg 4 + [incident-response.md](incident-response.md) signals |

Gaps (recorded honestly): there is no automated golden-answer scoring of match *quality* — see
[golden-dataset-policy.md](golden-dataset-policy.md) and
[regression-evaluation.md](regression-evaluation.md) for what is deferred.
