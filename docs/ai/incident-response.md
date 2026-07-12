---
id: ai-incident-response
title: AI Incident Response
type: doc
authority: canonical
status: current
owner: repository owner
summary: Pointer to the AI provider outage runbook plus the AI-specific signals, levers, and escalation boundaries.
keywords: [ai, incident, outage, runbook, provider, rate-limit, escalation, operations]
contextTier: 2
relatedCode: [apps/api/src/modules/ai/adapters/ai-router.service.ts, apps/api/src/modules/ai/model/gemini.constants.ts]
relatedTests: [apps/api/src/modules/ai/tests/ai-router.service.test.ts]
relatedDocs: [runbooks/ai-provider-outage.md, runbooks/incident-response-template.md, docs/ai/fallback-routing.md]
readWhen: The analyze flow is failing with AI error codes and you need the operational playbook.
---

# AI Incident Response

**Owner of the playbook:**
[runbooks/ai-provider-outage.md](../../runbooks/ai-provider-outage.md) — confirmation steps,
log signatures, rate measurement, mitigation, and severity guidance live there (general incident
process: [runbooks/incident-response-template.md](../../runbooks/incident-response-template.md)).
This page adds the AI-subsystem context an operator needs alongside it.

## Recognizing an AI incident

- The API is healthy but analyze fails: 502 envelopes carrying `AI_PROVIDER_UNAVAILABLE` /
  `AI_TIMEOUT`, or 429 with `AI_RATE_LIMITED` — these are **chain-exhaustion** results, meaning
  every entry in the step's route already failed ([fallback-routing.md](fallback-routing.md)).
- Log signature: `errors.ai.*` messageKeys in the structured logs; the runbook shows the exact
  `docker compose logs` incantations and the transient-vs-outage rate heuristic.
- User impact is bounded by design: terminal error frames (never endless spinners), and — per the
  runbook — nothing is lost: no data, no images, no state (the API is stateless).

## Levers, in order

1. **Route around it (env-only, no deploy of code):** point the affected step's
   `AI_ROUTE_<STEP>` / `GEMINI_MODEL_<STEP>` at a healthy provider/model and restart —
   [model-change-checklist.md](model-change-checklist.md) §Rollout/rollback. Constraint:
   extraction can only route to Gemini (fail-closed vision), so a full Gemini outage has no
   extraction fallback — that is a wait-or-communicate situation.
2. **Rate-limit storms:** distinguish provider 429s (`AI_RATE_LIMITED`, exhaustion → 429) from
   our own throttles; reduce inbound pressure via the concurrency/throttle caps if needed
   ([concurrency-policy.md](concurrency-policy.md)).
3. **Timeout storms:** check `GEMINI_TIMEOUT_MS` / `GEMINI_STREAM_IDLE_TIMEOUT_MS` sanity per
   the runbook ([retry-timeout-policy.md](retry-timeout-policy.md)).
4. **Suspect our own change, not the provider,** if the failure coincides with a release —
   the runbook escalates severity in that case; rollback rules are owned by
   [docs/release-checklist.md](../release-checklist.md).

## During and after

- Shadow runs are safe to disable instantly (`AI_SHADOW_ENABLED=false`) to shed optional load —
  they never affect users ([shadow-routing.md](shadow-routing.md)).
- Verify recovery with a real analyze flow and the adapters' `Step … served by …` log lines.
- Serious incidents require the blameless postmortem artifact per `CLAUDE.md` phase 27; if the
  incident taught a new permanent rule, update the owning doc and rebuild the knowledge plane
  (`npm run knowledge:build`, [knowledge/README.md](../../knowledge/README.md)).
