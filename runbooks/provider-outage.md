---
id: runbook-provider-outage
title: Runbook — AI Provider Outage (Any Provider, Multi-Provider Routing)
type: runbook
authority: canonical
status: current
owner: repository owner
summary: Diagnosing and mitigating AI provider outages under the multi-provider router — signatures, route-hopping behavior, config checks, and recovery.
keywords: [runbook, ai, provider, outage, gemini, router, ai-route, 502, fallback, degradation]
contextTier: 2
relatedCode:
  [
    apps/api/src/modules/ai/adapters/ai-router.service.ts,
    apps/api/src/modules/ai/adapters/provider-registry.service.ts,
    apps/api/src/modules/ai/model/gemini.constants.ts,
  ]
relatedTests: [apps/api/src/modules/ai/tests/ai-router.service.test.ts]
relatedDocs: [runbooks/ai-provider-outage.md, docs/provider-routing.md, support/provider-outage-messaging.md]
readWhen: Analyze is failing with AI errors while the API itself is healthy.
---

# Runbook — AI Provider Outage

The Gemini-focused procedure (log signatures, rate measurement, mitigation posture) is [`ai-provider-outage.md`](./ai-provider-outage.md) — follow it for the core diagnosis. This runbook adds the multi-provider routing layer shipped since (`docs/provider-routing.md`). What players see meanwhile: [`../support/provider-outage-messaging.md`](../support/provider-outage-messaging.md).

## Prerequisites

- API confirmed healthy (`GET /api/v1/health` 200) — otherwise this is [`api-outage.md`](./api-outage.md).
- Access to the API logs (`docker compose logs api`).

## How the router degrades (know before touching anything)

- Each pipeline step (extraction/generation/judge/translation) walks its configured chain — `AI_ROUTE_<STEP>` `provider:model` entries, or the `GEMINI_MODEL*` chains when no explicit route — hopping to the next entry on recoverable errors (`AiRateLimited`, `AiProviderUnavailable`, `AiTimeout`, `AiResponseInvalid`; `apps/api/src/modules/ai/adapters/ai-router.service.ts`).
- Chain exhaustion surfaces as **429 if any hop was rate-limited, else 502** to the client.
- **Extraction always requires a vision-capable (Gemini) entry** — fail-closed image policy (`AI_IMAGE_STEPS`, `apps/api/src/config/gemini-step.constants.ts`). A Gemini outage therefore always breaks analyses even if text providers are healthy.
- A provider is enabled iff its API key is set (`isProviderEnabled`); the registry validates explicit routes at boot.

## Steps

1. Run the diagnosis in [`ai-provider-outage.md`](./ai-provider-outage.md) §1–2 (confirm provider vs us; measure `errors.ai.*` rate; check `GEMINI_API_KEY`/`GEMINI_MODEL`/timeouts).
2. Identify **which provider/step** is failing: warn/error log lines from the router name the step and hop outcomes; check whether failures cluster on one `provider:model` entry.
3. Check the affected provider's status page and quota dashboard.
4. Mitigation options, cheapest first:
   - **Wait + player retry** — the designed degradation; nothing is lost.
   - **Reorder/extend a step's chain** via `AI_ROUTE_<STEP>` or `GEMINI_FALLBACK_MODELS_<STEP>` (env change + restart). Model/provider changes are change-controlled — prompt/safety behavior may differ; prefer models already vetted by the benchmark harness (`docs/ai-benchmarking.md`), and never auto-apply benchmark output.
   - **Remove a dead provider's key** to stop the router wasting hops on it.
5. Do **not** disable validation or the safety filter, and do not dramatically lengthen timeouts (`ai-provider-outage.md` §3).

## Verify

- `errors.ai.*` rate back to ~zero: `docker compose logs --since 10m api | grep -c '"errors.ai.'`
- Analyze happy path succeeds ([release-smoke-test.md](./release-smoke-test.md) §3).
- If routes were changed: boot logs show the routing validation passed, and one request per changed step traced end-to-end by request id.

## Rollback

Route/env mitigation rolls back by restoring the previous env values (clearing `AI_ROUTE_<STEP>` restores Gemini-only defaults) and restarting. If the incident began with a release, revert it instead ([rollback.md](./rollback.md)).
