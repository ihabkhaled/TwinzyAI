---
id: operations-retry-budget
title: Retry Budget
type: operations
authority: canonical
status: current
owner: repository owner
summary: Every retry/fallback mechanism in the system — AI model chains, route hopping, ClamAV host list, PayPal idempotency and refund — and the bound on each.
keywords: [retry, fallback, idempotency, model-chain, route, refund, clamav, budget]
contextTier: 2
relatedCode: [apps/api/src/modules/ai/adapters/ai-router.service.ts, apps/api/src/modules/ai/adapters/gemini.adapter.ts, apps/api/src/modules/payments/adapters/paypal.adapter.ts, apps/api/src/modules/file-security/adapters/clamav.adapter.ts]
relatedTests: [apps/api/src/modules/ai/tests/ai-router.service.test.ts, apps/api/src/modules/payments/tests/paypal.adapter.test.ts]
relatedDocs: [operations/timeout-budget.md, docs/provider-routing.md]
readWhen: You are changing failure handling for an external dependency, or debugging duplicated or repeated downstream calls.
---

# Retry Budget

Policy baseline: retries must have limits and observability (CLAUDE.md Error Handling Rules).
Every recorded retry mechanism and its bound:

## AI provider calls

1. **Model-chain fallback (within one provider)** — `GeminiAdapter.runAcrossModels` walks the
   configured chain (`GEMINI_MODEL` + `GEMINI_FALLBACK_MODELS`, per-step variants replace the
   global chain). Bound: the chain length; entries are deduped and empties dropped
   ([apps/api/src/modules/ai/adapters/gemini.adapter.ts](../apps/api/src/modules/ai/adapters/gemini.adapter.ts),
   [apps/api/src/config/app-config.service.ts](../apps/api/src/config/app-config.service.ts)).
2. **Route hopping (across providers)** — `AiRouterService` advances to the next
   `provider:model` entry only on recoverable errors (`AiRateLimited`,
   `AiProviderUnavailable`, `AiTimeout`, `AiResponseInvalid` —
   [apps/api/src/modules/ai/model/ai-router.constants.ts](../apps/api/src/modules/ai/model/ai-router.constants.ts)).
   Bound: `MAX_AI_ROUTE_ENTRIES = 10` per step
   ([apps/api/src/config/ai-route.constants.ts](../apps/api/src/config/ai-route.constants.ts)).
   Exhaustion → 429 if any hop was rate-limited, else 502
   ([apps/api/src/modules/ai/adapters/ai-router.service.ts](../apps/api/src/modules/ai/adapters/ai-router.service.ts)).
3. **Content-validator retry** — a schema-invalid response can trigger a bounded re-ask inside
   the adapter call ([apps/api/src/modules/ai/adapters/gemini.adapter.ts](../apps/api/src/modules/ai/adapters/gemini.adapter.ts)).
4. **Shadow runs never retry** — fire-and-forget, failures swallowed to one warn line
   ([apps/api/src/modules/ai/adapters/ai-shadow.service.ts](../apps/api/src/modules/ai/adapters/ai-shadow.service.ts)).

Image-carrying calls only dispatch to vision-capable (Gemini) entries — fallback never widens
the image boundary ([apps/api/src/modules/ai/adapters/provider-registry.service.ts](../apps/api/src/modules/ai/adapters/provider-registry.service.ts)).

## ClamAV

Ordered host list `CLAMAV_HOSTS` (default `127.0.0.1,clamav`); the adapter tries hosts in
order and caches the first reachable one. Bound: the list length; scan errors fail closed
([apps/api/src/modules/file-security/adapters/clamav.adapter.ts](../apps/api/src/modules/file-security/adapters/clamav.adapter.ts),
[apps/api/src/modules/file-security/application/virus-scan.service.ts](../apps/api/src/modules/file-security/application/virus-scan.service.ts)).

## PayPal (money — deliberately NO automatic retry)

- No automatic retry of PayPal REST calls is implemented; each call has a 15 s deadline
  ([timeout-budget.md](timeout-budget.md)) and failures map to typed 402/502 errors
  ([apps/api/src/modules/payments/adapters/paypal.adapter.ts](../apps/api/src/modules/payments/adapters/paypal.adapter.ts)).
- Safety against duplicates comes from idempotency, not retries: every call carries a
  `paypal-request-id` header, and replaying a captured order fails at PayPal
  (`ORDER_ALREADY_CAPTURED` — [docs/features/paypal-donations-and-paid-results/22-go-no-go.md](../docs/features/paypal-donations-and-paid-results/22-go-no-go.md)).
- **Refund on failure is best-effort, attempted once**: if the refund itself fails, the adapter
  logs `REFUND FAILED … reconcile in the PayPal dashboard` and never masks the original error
  ([apps/api/src/modules/payments/application/payment-gate.service.ts](../apps/api/src/modules/payments/application/payment-gate.service.ts)).
  Manual reconciliation is the recorded fallback.

## What must stay true

- No unbounded or hidden retry loops anywhere; every mechanism above has an explicit bound.
- Rate limits are never retried through: 429s surface to the client
  ([apps/api/src/core/errors/error-body.mapper.ts](../apps/api/src/core/errors/error-body.mapper.ts)).
- CI flakiness is a defect, not a retry-until-green candidate (CLAUDE.md CI/CD rules).
