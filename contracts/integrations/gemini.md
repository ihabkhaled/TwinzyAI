---
id: contracts-integrations-gemini
title: Gemini SDK Integration Contract
type: contract
authority: canonical
status: current
owner: repository owner
summary: The Gemini adapter's SDK surface — the only @google/genai importer — with its timeouts, response byte cap, model-chain retry, JSON output settings, and log redaction guarantees.
keywords: [gemini, google-genai, adapter, timeout, idle-timeout, byte-cap, redaction, model-chain, vision]
contextTier: 2
relatedCode: [apps/api/src/modules/ai/adapters/gemini.adapter.ts, apps/api/src/modules/ai/model/gemini.constants.ts, apps/api/src/modules/ai/lib/provider-error.util.ts]
relatedTests: [apps/api/src/modules/ai/tests/gemini.adapter.test.ts, apps/api/src/modules/ai/tests/provider-error.util.test.ts]
relatedDocs: [contracts/ai/README.md, docs/provider-routing.md, docs/env-vars.md]
readWhen: You are changing the Gemini adapter, its timeouts/caps, or diagnosing Gemini call failures.
---

# Gemini SDK Integration Contract

`apps/api/src/modules/ai/adapters/gemini.adapter.ts` is **the only file in the codebase
allowed to import `@google/genai`**. It implements both the image-capable and text methods of
the provider port ([../ai/README.md](../ai/README.md)) and is the **only adapter that may
receive the user's photo** (fail-closed vision rule in
`apps/api/src/modules/ai/adapters/provider-registry.service.ts`).

## Call settings

From `apps/api/src/modules/ai/model/gemini.constants.ts`: temperature **0.4**,
`responseMimeType: 'application/json'`. Model ids come exclusively from env — never
hardcoded (product constraint; resolution precedence in
[../ai/README.md](../ai/README.md)).

## Timeouts and caps (all env-driven; defaults in `apps/api/src/config/env.schema.ts`)

| Cap | Env var | Default | Behavior |
| --- | --- | --- | --- |
| Total per-call timeout | `GEMINI_TIMEOUT_MS` | 30,000 ms | AbortController cancels the call |
| Streaming idle timeout | `GEMINI_STREAM_IDLE_TIMEOUT_MS` | 60,000 ms | Inter-chunk timer, reset on every chunk |
| Response byte cap | `AI_MAX_RESPONSE_BYTES` | 500,000 B | Streamed assembly aborts mid-flight on overflow → `AI_RESPONSE_INVALID` |

External aborts (cancel, disconnect, watchdog) are bridged onto the per-call controller via
`apps/api/src/modules/ai/lib/abort-bridge.util.ts`.

## Model-chain retry

`runAcrossModels` walks the models pinned by the router for this dispatch. Raw provider
errors are classified by `apps/api/src/modules/ai/lib/provider-error.util.ts`: HTTP
429/quota/rate-limit patterns → RateLimited; 500/503/404/overloaded/unavailable →
Unavailable — both retryable on the next model; anything else is Fatal → 502. Our own typed
AppErrors are terminal per model. A content-validator failure (the per-model schema check
from `buildSchemaValidator`) also advances to the next model instead of failing the request.

## Privacy and logging guarantees

- Provider error text is redacted before logging via `redactForLog`
  (`apps/api/src/modules/privacy/lib/log-redaction.helpers.ts`): values capped at 500 chars,
  base64 runs (the signature of leaked image bytes) and key/token/authorization secrets
  replaced with `[REDACTED]`.
- Image bytes are never logged; the image reaches this adapter only for the extraction step
  and the upload buffer is zero-filled in the use-case `finally`
  (see [docs/privacy-and-data-retention.md](../../docs/privacy-and-data-retention.md)).
- Success logging: `Step <step> served by model <model>` plus a call-ok line with duration
  (no prompt/response contents).

## Error surface

Failures map to the shared codes `AI_PROVIDER_UNAVAILABLE`, `AI_RATE_LIMITED`, `AI_TIMEOUT`,
`AI_RESPONSE_INVALID` (user-facing copy in `gemini.constants.ts`), delivered through the
[error envelope](../api/error-envelope.md) or the SSE terminal frame.
