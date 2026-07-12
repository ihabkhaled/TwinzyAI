---
id: runbook-ai-schema-failures
title: Runbook — AI Schema and Safety-Filter Failures
type: runbook
authority: canonical
status: current
owner: repository owner
summary: Handling sustained AI_RESPONSE_INVALID / AI_RESPONSE_UNSAFE rates — model-behavior defects, not outages — without ever weakening validation.
keywords: [runbook, ai, schema, zod, validation, unsafe, response-invalid, prompt, model-behavior]
contextTier: 2
relatedCode:
  [
    apps/api/src/modules/ai/lib/json-response.util.ts,
    apps/api/src/modules/ai/application/ai-safety.service.ts,
    apps/api/src/modules/ai/adapters/gemini.adapter.ts,
  ]
relatedTests: [apps/api/src/modules/ai/tests/ai-safety.service.test.ts, apps/api/src/modules/ai/tests/gemini.adapter.test.ts]
relatedDocs: [docs/ai-safety.md, docs/ai-benchmarking.md, runbooks/provider-outage.md]
readWhen: Logs show sustained AI_RESPONSE_INVALID or AI_RESPONSE_UNSAFE — the provider is up but its output is being rejected.
---

# Runbook — AI Schema and Safety-Filter Failures

**These codes mean the provider is UP but its responses fail our contracts** — a model-behavior problem, not an outage (`ai-provider-outage.md` §1). Every AI response is zod-validated against the exact shared schemas and swept by the forbidden-wording guard before use (`docs/ai-safety.md`); the guardrails are product constraints and are never loosened to "fix" a spike.

## The two codes

- `AI_RESPONSE_INVALID` (502) — output failed parsing/zod validation after the adapter's content-validator retry (`apps/api/src/modules/ai/adapters/gemini.adapter.ts`; bounded, privacy-safe issue summaries from `buildSchemaValidator`, `apps/api/src/modules/ai/lib/json-response.util.ts`). Also a route-hoppable error: the router tries the next chain entry first.
- `AI_RESPONSE_UNSAFE` (502) — output parsed but tripped the safety filter (`AiSafetyService` over the shared forbidden lists) or, at the item level, unsafe candidates/results are silently dropped.

Players see the generic "vibe engine unavailable" copy for both ([`../support/user-visible-error-guide.md`](../support/user-visible-error-guide.md)).

## Prerequisites

- Rate measured, not anecdotal: `docker compose logs --since 30m api | grep -c '"AI_RESPONSE_INVALID"'` (and `UNSAFE`).
- Release/config timeline at hand: what changed last — prompt file, model id, route, schema?

## Steps

1. **Correlate with change history.** The schema/prompt pair is kept in lock-step by a drift test (`docs/ai-safety.md`); a spike almost always follows a **model or route change**, a provider-side model update, or a prompt edit. If a recent release touched `apps/api/src/modules/ai/prompts/*`, shared schemas, `GEMINI_MODEL*`, or `AI_ROUTE_*` — that change is the prime suspect; revert it ([rollback.md](./rollback.md)).
2. **Identify the failing step** from the router/log context (extraction/generation/judge/translation) — per-step model pinning means one step can regress alone (`.env.example` per-step chains).
3. **Reproduce safely** with the benchmark harness: `npm run ai:benchmark` in mock mode validates the harness; real mode (billed, opt-in) scores the configured models on schema validity and safety with the exact production validators (`docs/ai-benchmarking.md`, `apps/api/src/benchmark/lib/benchmark-metrics.util.ts`).
4. **Mitigate by model selection**, not by weakening contracts: pin the affected step to a previously-good model via `GEMINI_MODEL_<STEP>`/`AI_ROUTE_<STEP>` (change control; benchmark evidence first).
5. **For `AI_RESPONSE_UNSAFE` spikes**: treat as a safety matter, not an ops tweak — escalate to AI-safety review (rules/14 checklist; `ai-provider-outage.md` Escalation). If any unsafe content actually **reached a player**, that is a SEV-1: [privacy-incident.md](./privacy-incident.md).

## Verify

- Failure rate back to baseline (re-run the greps).
- One analyze happy path per affected step configuration ([release-smoke-test.md](./release-smoke-test.md) §3).
- If a model/route changed: record the decision and benchmark evidence in the owning request stream.

## Rollback

Model/route pins are env-only rollbacks; prompt/schema changes revert as code ([rollback.md](./rollback.md)).

## Never

Never relax a zod schema, skip the safety sweep, raise `AI_MAX_RESPONSE_BYTES` to swallow garbage, or trust unvalidated output — Twinzy constraint #7 (CLAUDE.md) and `docs/ai-safety.md` own these guarantees.
