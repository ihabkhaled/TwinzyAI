# Multi-Provider AI Routing

TwinzyAI routes each AI pipeline step (trait **extraction**, candidate **generation**, **judge**, result **translation**) through a provider-agnostic router, so every step can run on the provider/model that fits its difficulty — with cross-provider fallbacks, fail-closed image capability, and optional shadow comparison. Everything is env-driven; **a Gemini-only configuration (today's default) needs no new variables and behaves exactly as before**.

## Why

The four prompts differ sharply in difficulty and risk (see `docs/features/multi-provider-ai/02-provider-research.md` for the July 2026 provider research). One vendor means one failure domain, one price curve, and one quality ceiling per step. The router removes that coupling without touching product behavior: same endpoints, same validation, same safety filters on every provider's output.

## Architecture (backend `apps/api/src/modules/ai`)

```
Step service ──(AI_PROVIDER_ADAPTER port)──▶ AiRouterService
                                               │ resolves the step's route chain (config)
                                               │ filters: provider enabled + vision-capable (image steps)
                                               │ walks entries across providers on recoverable failures
                                               │ fires the sampled shadow run after primary success
                                               ▼
                                       ProviderRegistryService
                                         ├─ gemini  → GeminiAdapter (SDK)
                                         └─ openai | deepseek | qwen | kimi | glm
                                              → OpenAiCompatAdapter (native fetch, per-provider baseUrl+key)
```

- **Route chains**: `AI_ROUTE_<STEP>` = comma-separated `provider:model` tokens. A bare model id means `gemini:<model>` (legacy compatible). An explicit route **replaces** the step's `GEMINI_*` chain; empty falls back to the `GEMINI_MODEL_<STEP>`/global chain mapped to gemini entries.
- **Enablement**: a provider is enabled iff its API key env var is non-empty (`<PROVIDER>_API_KEY`). Remove the key to disable — that is the rollback lever.
- **Fail-closed vision rule**: photo-carrying steps (extraction/generation/judge) dispatch only to gemini models (multimodal incumbents) or entries explicitly listed in `AI_VISION_MODELS`. A photo can never reach a provider the operator did not consciously allow. Check the provider's image data-use policy before declaring one (research doc: Kimi trains on API images — never declare it; OpenAI/Anthropic refuse photo→name tasks anyway).
- **Fallback semantics**: a hop advances on `AI_RATE_LIMITED`, `AI_PROVIDER_UNAVAILABLE`, `AI_TIMEOUT`, `AI_RESPONSE_INVALID` (schema-rejected content). Client cancellations and unexpected errors propagate immediately. Chain exhaustion → 429 if any hop was rate-limited, else 502 — identical envelopes to today.
- **Boot validation (fail fast)**: route parsing errors and an explicit route with zero usable entries crash the boot with a readable message. Implicit/legacy routes with no key only warn (CI and keyless dev boots stay green).
- **Observability**: every successful serve logs `Step <step> served by <provider>:<model> …`; every failed hop logs the entry and the privacy-safe reason (field paths only, never content).

## Shadow mode (metrics-only)

`AI_SHADOW_ENABLED=true` + `AI_SHADOW_SAMPLE_RATE=0.05` + `AI_SHADOW_ROUTE_<STEP>=provider:model` runs a sampled background copy of the step call on the shadow entry **after** the primary result was produced. Shadow output is never shown, never affects the result, failures are swallowed, and the run is bounded by `AI_SHADOW_TIMEOUT_MS`. Images are withheld unless `AI_SHADOW_ALLOW_IMAGE=true` **and** the entry is declared in `AI_VISION_MODELS`. The outcome is one log line: `shadow step=… route=… ms=… chars=… schemaOk=…` — grep these to compare a candidate provider against production traffic before promoting it into a real route.

## How to add a provider

1. If it exposes an OpenAI-compatible chat-completions endpoint: add its id to `AiProvider` + env keys/base URL in `apps/api/src/config/ai-provider.constants.ts`, extend the env schema, done — the shared adapter covers it. Otherwise write a new adapter in `modules/ai/adapters/` (SDK/HTTP confined there) and register it in `ProviderRegistryService`.
2. Document its image data-use policy; only then consider `AI_VISION_MODELS`.
3. Add its key to the deployment env; put it in a shadow route first; graduate to a fallback, then primary, based on the shadow logs/benchmark.

## Rollout / rollback

Ship dark (no non-Gemini keys set) → shadow a candidate on one step at a low sample rate → review logs → move it into that step's `AI_ROUTE_<STEP>` as a fallback → promote to primary if it earns it. **Rollback at any point = env change only** (clear the route var or remove the provider key and restart).

## Invariants that never change

Every provider's output passes the same Zod schemas and safety filter; the image is never persisted or logged; provider keys live only in backend env; translation and any text-only step never receive the image; no model or provider id is hardcoded in code.
