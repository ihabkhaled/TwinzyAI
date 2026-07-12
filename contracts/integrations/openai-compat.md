---
id: contracts-integrations-openai-compat
title: OpenAI-Compatible Providers Integration Contract
type: contract
authority: canonical
status: current
owner: repository owner
summary: The single fetch-based adapter serving OpenAI, DeepSeek, Qwen, Kimi, and GLM via chat-completions — its HTTP surface, timeouts, byte caps, text-only restriction, and enablement rules.
keywords: [openai, deepseek, qwen, kimi, glm, chat-completions, adapter, fetch, text-only, base-url]
contextTier: 2
relatedCode: [apps/api/src/modules/ai/adapters/openai-compat.adapter.ts, apps/api/src/config/ai-provider.constants.ts, apps/api/src/modules/ai/model/openai-compat.constants.ts]
relatedTests: [apps/api/src/modules/ai/tests/openai-compat.adapter.test.ts]
relatedDocs: [contracts/ai/README.md, docs/provider-routing.md, contracts/integrations/gemini.md]
readWhen: You are enabling a non-Gemini provider, changing its base URL, or debugging its calls.
---

# OpenAI-Compatible Providers Integration Contract

`apps/api/src/modules/ai/adapters/openai-compat.adapter.ts` is **one adapter** serving five
providers — openai, deepseek, qwen, kimi, glm — over the OpenAI chat-completions wire format
using the platform `fetch` (no SDK). It is not a NestJS provider: the registry constructs one
instance per enabled provider (`apps/api/src/modules/ai/adapters/provider-registry.service.ts`).

## HTTP surface

- `POST {baseUrl}/chat/completions` (path in
  `apps/api/src/modules/ai/model/openai-compat.constants.ts`), bearer auth with the
  provider's API key.
- Request settings: temperature **0.4**, `response_format: json_object`.
- Wire shapes typed in `apps/api/src/modules/ai/model/openai-compat.types.ts`.

## Enablement and base URLs

A provider exists iff its API key env var is non-empty (`isProviderEnabled`,
`apps/api/src/config/app-config.service.ts`). Keys/base-URL env vars and defaults live in
`apps/api/src/config/ai-provider.constants.ts` (`OPENAI_COMPAT_DEFAULT_BASE_URLS`):

| Provider | Env vars | Default base URL |
| --- | --- | --- |
| openai | `OPENAI_API_KEY` / `OPENAI_BASE_URL` | `https://api.openai.com/v1` |
| deepseek | `DEEPSEEK_API_KEY` / `DEEPSEEK_BASE_URL` | `https://api.deepseek.com/v1` |
| qwen | `QWEN_API_KEY` / `QWEN_BASE_URL` | DashScope-intl compatible mode |
| kimi | `KIMI_API_KEY` / `KIMI_BASE_URL` | `https://api.moonshot.ai/v1` |
| glm | `GLM_API_KEY` / `GLM_BASE_URL` | `https://api.z.ai/api/paas/v4` |

## Restrictions and semantics

- **Text-only**: `generateFromImage*` always rejects with `AI_PROVIDER_UNAVAILABLE` — the
  user's photo can never reach these providers (fail-closed rule owned by
  [../ai/README.md](../ai/README.md)).
- **Pseudo-streaming**: the `*Stream` methods perform a non-streaming call and fire
  `onChunk` exactly once.
- **Timeout**: reuses `GEMINI_TIMEOUT_MS` as the total per-call bound; external aborts
  bridge onto the fetch `signal` via `apps/api/src/modules/ai/lib/abort-bridge.util.ts`.
- **Byte caps**: both the declared `content-length` and the actual body are capped at
  `AI_MAX_RESPONSE_BYTES`.
- **Failure mapping**: HTTP 429 → typed `AI_RATE_LIMITED`; other failures classify through
  the same provider-error rules as Gemini
  (`apps/api/src/modules/ai/lib/provider-error.util.ts`), letting the router hop to the next
  route entry ([../ai/README.md](../ai/README.md)).
- Success log line: `Step <step> served by <provider>:<model>`.

## Routing

These providers participate in step routes via `AI_ROUTE_<STEP>` tokens
(`provider:model`) — semantics owned by
[docs/provider-routing.md](../../docs/provider-routing.md).
