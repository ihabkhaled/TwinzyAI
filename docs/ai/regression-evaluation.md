---
id: ai-regression-evaluation
title: AI Regression Evaluation
type: doc
authority: canonical
status: current
owner: repository owner
summary: How AI regressions are caught today — contract/safety test suites, benchmark re-runs, calibrate re-runs — and which quality-regression automation is deferred.
keywords: [ai, regression, evaluation, tests, benchmark, quality, drift, coverage]
contextTier: 2
relatedCode: [apps/api/src/modules/ai/tests, apps/api/src/tests/fixtures/fake-ai-adapter.ts]
relatedTests: [apps/api/src/modules/ai/tests/ai-pipeline.test.ts, apps/api/src/tests/game-analyze-stream.integration.test.ts]
relatedDocs: [docs/ai/evaluation-framework.md, docs/ai/golden-dataset-policy.md, docs/testing-strategy.md]
readWhen: You changed prompts, schemas, routing, or safety code and need to know which regression net catches what.
---

# AI Regression Evaluation

**Owner of the repo-wide testing strategy:** [docs/testing-strategy.md](../testing-strategy.md).
This page maps what catches an AI regression today.

## Automated, every change (`npm run test:ai`)

The suite at `apps/api/src/modules/ai/tests/` plus the game/result-aggregation projects
(package.json:52) regression-pins:

| Guarantee | Test file |
| --- | --- |
| Prompt↔taxonomy lock-step (every taxonomy field in the prompt) | `ai-pipeline.test.ts:94` |
| Router hop/exhaustion behavior | `ai-router.service.test.ts` |
| Provider error classification | `provider-error.util.test.ts` |
| Gemini adapter timeouts/byte caps/aborts | `gemini.adapter.test.ts` |
| OpenAI-compat adapter (incl. image rejection) | `openai-compat.adapter.test.ts` |
| Vision fail-closed registry + boot validation | `provider-registry.service.test.ts` |
| Safety reject/drop policy | `ai-safety.service.test.ts` |
| Forbidden-wording scanning | `forbidden-wording.guard.test.ts` |
| Parse/validator behavior | `json-response.util.test.ts`, `ai-response-sanitizer.test.ts` |
| Translation shape guard | `json-shape.util.test.ts` |
| Prompt template placeholder rules | `prompt-template.repository.test.ts` |
| Shadow sampling/isolation | `ai-shadow.service.test.ts` |
| End-to-end game flows over a fake adapter | `apps/api/src/tests/game-analyze*.integration.test.ts` (fixtures: `apps/api/src/tests/fixtures/fake-ai-adapter.ts`) |

Coverage policy (95% on touched modules) and gates are owned by `CLAUDE.md` and
[docs/testing-strategy.md](../testing-strategy.md).

## Semi-automated, on demand

- **Benchmark re-run** — `npm run ai:benchmark` before/after a change; compare
  `report.json` axes (schema/safety/speed). Mock mode regression-checks the harness and guard
  wiring itself; real mode regression-checks live routes
  ([benchmark-methodology.md](benchmark-methodology.md)).
- **Calibrate re-run** — `npm run calibrate` with the operator's photo set and `EXPECT` names,
  comparing recall and rank-1 scores against the previous run's written conclusions
  ([evaluation-framework.md](evaluation-framework.md) Leg 3).

## Manual, per release

The release checklist and manual QA docs own the human pass:
[docs/release-checklist.md](../release-checklist.md),
[docs/manual-qa-checklist.md](../manual-qa-checklist.md).

## Deferred (recorded gap)

Automated *quality* regression — scoring match quality against versioned goldens across releases
— does not exist; blockers and the acceptable data form are recorded in
[golden-dataset-policy.md](golden-dataset-policy.md). Until then, quality regressions are caught
by the calibrate harness plus written UAT conclusions, which is a manual, operator-dependent net.
