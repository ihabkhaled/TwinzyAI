---
id: ai-provider-catalog
title: AI Provider Catalog
type: doc
authority: canonical
status: current
owner: repository owner
summary: The six dispatchable AI providers — Gemini (vision-capable, own SDK adapter) and five OpenAI-compatible text-only providers — with their env keys and capabilities.
keywords: [ai, providers, gemini, openai, deepseek, qwen, kimi, glm, adapters, vision]
contextTier: 2
relatedCode: [apps/api/src/config/ai-provider.constants.ts, apps/api/src/modules/ai/adapters/gemini.adapter.ts, apps/api/src/modules/ai/adapters/openai-compat.adapter.ts, apps/api/src/modules/ai/adapters/provider-registry.service.ts]
relatedTests: [apps/api/src/modules/ai/tests/gemini.adapter.test.ts, apps/api/src/modules/ai/tests/openai-compat.adapter.test.ts, apps/api/src/modules/ai/tests/provider-registry.service.test.ts]
relatedDocs: [docs/provider-routing.md, docs/ai/model-routing.md, docs/ai/provider-change-checklist.md]
readWhen: You need to know which providers exist, what they can do (vision vs text), or which env vars enable them.
---

# AI Provider Catalog

Provider ids, env keys, and default endpoints are defined once in
[`apps/api/src/config/ai-provider.constants.ts`](../../apps/api/src/config/ai-provider.constants.ts).
**A provider is ENABLED iff its API key env var is non-empty** — key presence is the enable flag
(Gemini is always registered). Routing detail is owned by
[docs/provider-routing.md](../provider-routing.md).

| Provider id | Adapter | Vision | API key env | Base URL env (default) |
| --- | --- | --- | --- | --- |
| `gemini` | [`gemini.adapter.ts`](../../apps/api/src/modules/ai/adapters/gemini.adapter.ts) — the ONLY file importing `@google/genai` | **Yes — the only one** | `GEMINI_API_KEY` | SDK-managed |
| `openai` | shared [`openai-compat.adapter.ts`](../../apps/api/src/modules/ai/adapters/openai-compat.adapter.ts) | No | `OPENAI_API_KEY` | `OPENAI_BASE_URL` (`https://api.openai.com/v1`) |
| `deepseek` | shared openai-compat | No | `DEEPSEEK_API_KEY` | `DEEPSEEK_BASE_URL` (`https://api.deepseek.com/v1`) |
| `qwen` | shared openai-compat | No | `QWEN_API_KEY` | `QWEN_BASE_URL` (`https://dashscope-intl.aliyuncs.com/compatible-mode/v1`, international DashScope) |
| `kimi` | shared openai-compat | No | `KIMI_API_KEY` | `KIMI_BASE_URL` (`https://api.moonshot.ai/v1`) |
| `glm` | shared openai-compat | No | `GLM_API_KEY` | `GLM_BASE_URL` (`https://api.z.ai/api/paas/v4`) |

## Gemini adapter (vision + text)

- Model-chain walk with typed error classification (`lib/provider-error.util.ts`: 429/quota ⇒
  RateLimited; 500/503/404/overloaded ⇒ Unavailable; both retryable on the next model; else
  Fatal ⇒ 502).
- Streaming: total timeout + idle inter-chunk timer + response byte cap
  ([retry-timeout-policy.md](retry-timeout-policy.md)); external aborts bridged via
  `lib/abort-bridge.util.ts`.
- `temperature 0.4`, `responseMimeType application/json`
  (`apps/api/src/modules/ai/model/gemini.constants.ts`). Provider error text is redacted before
  logging; image bytes are never logged.
- Empty model chain throws `AiProviderUnavailable` — there is no hardcoded fallback model
  (`gemini.adapter.ts:296-302`).

## OpenAI-compatible adapter (text-only, one adapter for five providers)

- Platform `fetch` (no SDK) to `POST {baseUrl}/chat/completions`
  (`model/openai-compat.constants.ts`; temperature 0.4, `response_format: json_object`).
- `generateFromImage*` **always rejects** with `AI_PROVIDER_UNAVAILABLE` — vision unsupported by
  contract. The `*Stream` methods perform a non-streaming call and fire `onChunk` once.
- Reuses `GEMINI_TIMEOUT_MS` as its total timeout; content-length and body capped at
  `AI_MAX_RESPONSE_BYTES`; 429 maps to the typed rate-limit error.

## Vision dispatch is fail-closed

`provider-registry.service.ts:82` hardcodes the image filter: a photo-carrying call can only ever
dispatch to Gemini (`!carriesImage || entry.provider === AiProvider.Gemini`). There is **no env
switch** to grant vision to another provider (a stale comment at
`apps/api/src/config/env.schema.ts:153-157` describes a vision-declaration variable that does not
exist). Boot validation: an explicit `AI_ROUTE_<STEP>` with zero usable entries throws; implicit
empty routes only warn.

Adding a provider: [provider-change-checklist.md](provider-change-checklist.md) (procedure owned
by [docs/provider-routing.md](../provider-routing.md) §"How to add a provider").
