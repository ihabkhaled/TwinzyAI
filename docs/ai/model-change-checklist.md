---
id: ai-model-change-checklist
title: Model Change Checklist
type: doc
authority: canonical
status: current
owner: repository owner
summary: Actionable checklist for changing which model serves a pipeline step — benchmark first, shadow-trial, flip env routes, verify, document.
keywords: [ai, checklist, model, routing, env, benchmark, shadow, rollout, rollback]
contextTier: 2
relatedCode: [apps/api/src/config/app-config.service.ts, apps/api/src/config/gemini-step.constants.ts]
relatedTests: [apps/api/src/modules/ai/tests/ai-router.service.test.ts]
relatedDocs: [docs/ai/model-routing.md, docs/provider-routing.md, docs/ai/benchmark-methodology.md]
readWhen: You are about to change GEMINI_MODEL*, GEMINI_FALLBACK_MODELS*, or AI_ROUTE_* values.
---

# Model Change Checklist

Model selection is **config, not code** — no model name may ever be hardcoded (`CLAUDE.md`
Twinzy constraint #6; verified fail-safe in `gemini.adapter.ts:296-302`). Resolution precedence
is owned by [model-routing.md](model-routing.md).

## Before changing anything

- [ ] Identify the step(s) affected (extraction/generation/judge/translation) and which env
      layer you are changing: `AI_ROUTE_<STEP>` vs `GEMINI_MODEL_<STEP>`+fallbacks vs global
      `GEMINI_MODEL`+`GEMINI_FALLBACK_MODELS`. Remember: per-step values REPLACE the lower
      layers, never merge.
- [ ] For extraction: only Gemini entries are usable (fail-closed vision,
      `provider-registry.service.ts:82`) — a non-Gemini extraction model is a no-op at best and
      a boot error if the explicit route has no usable entry.
- [ ] Benchmark the candidate: `npm run ai:benchmark -- --mode=real` and compare
      schema/safety/speed axes against the incumbent
      ([benchmark-methodology.md](benchmark-methodology.md)).
- [ ] For text steps, optionally shadow-trial on live traffic first:
      `AI_SHADOW_ENABLED=true`, small `AI_SHADOW_SAMPLE_RATE`, `AI_SHADOW_ROUTE_<STEP>` set to
      the candidate; watch the `shadow step=…` log lines for `schemaOk` rate and `ms`
      ([shadow-routing.md](shadow-routing.md)); mind spend ([cost-policy.md](cost-policy.md)).

## Making the change

- [ ] Update the env value(s); keep a fallback chain — a single-entry chain has no hop headroom
      ([fallback-routing.md](fallback-routing.md)).
- [ ] Update `.env.example` if the documented example values change, and your local `.env`
      (see the env-sync memory rule); update [docs/env-vars.md](../env-vars.md) if var semantics
      changed (values alone need no doc change).
- [ ] Boot the API — route parsing and boot validation run at startup
      ([model-routing.md](model-routing.md)).

## Verify

- [ ] `npm run test:ai` (routing behavior is model-agnostic, but this catches accidental code
      edits); full gates if any file changed: `npm run lint` · `npm run typecheck` ·
      `npm run test:coverage` · `npm run build`.
- [ ] Run a real analyze flow (or `npm run calibrate` with a test photo) against the new
      config and read the adapter's `Step … served by …` log lines to confirm the intended
      model served each step ([evaluation-framework.md](evaluation-framework.md)).
- [ ] Watch quality: calibrate recall/rank-1 vs the previous run
      ([regression-evaluation.md](regression-evaluation.md)).

## Rollout / rollback

- [ ] Rollback is restoring the previous env values — keep them recorded in the change
      description ([docs/provider-routing.md](../provider-routing.md) §Rollout / rollback).
- [ ] If this responds to a provider incident, follow
      [incident-response.md](incident-response.md) instead of ad-hoc flips.

## Document

- [ ] If defaults, semantics, or the recommended chain changed: update
      [model-routing.md](model-routing.md) / [docs/provider-routing.md](../provider-routing.md)
      and rebuild the knowledge plane (`npm run knowledge:build`,
      [knowledge/README.md](../../knowledge/README.md)).
