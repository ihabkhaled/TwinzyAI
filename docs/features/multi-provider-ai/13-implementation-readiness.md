# 13 - Implementation Readiness (compressed 05/06/07/10/13)

## Standards constraints frozen (10)

- No new npm dependencies: OpenAI-compatible calls via native `fetch` inside the adapter (library-wrapping rule satisfied — the adapter IS the wrapper); Anthropic deferred unless benchmarks justify its bespoke protocol.
- No TS `enum`; as-const vocabularies. No inline types/constants in layer files — all in `model/` + `config/`.
- No process.env outside config; all routing/credentials zod-validated fail-fast.
- No eslint suppressions; complexity/params caps respected (options objects).
- Provider SDK/raw-HTTP confined to adapters (`architecture/no-direct-sdk-imports` + review).
- Photos: image payloads may only be dispatched to entries explicitly declared vision-capable (fail-closed default text-only).

## Delivery slices (05/07)

1. **MP-3 Contracts**: provider vocabulary (`AiProvider` as-const), route parsing (`provider:model`), capability types, config schema + getters, startup validation. Tests.
2. **MP-4 Router**: `ProviderRegistry` + `AiRouterService` implementing the `AiProviderAdapter` port; re-bind `AI_PROVIDER_ADAPTER`; Gemini adapter registered as `gemini`. Cross-provider chain walk + capability guard + normalized errors + per-step logs. Tests.
3. **MP-5 Adapter**: `OpenAiCompatAdapter` (fetch-based, parameterized per provider: openai/deepseek/qwen/kimi/glm base URLs from config), disabled unless key present + enabled flag. Tests.
4. **MP-6 Shadow**: sampled post-primary metrics-only execution behind env flags. Tests.
5. **MP-7 Benchmark**: `npm run ai:benchmark` (mock/real modes), per-step fixture matrix, metrics, scorecard, markdown+JSON reports under `docs/features/multi-provider-ai/benchmarks/`. Tests for scoring + mock run.
6. **MP-8 Docs + gates**: provider-routing.md, ai-benchmarking.md, .env.example, memory decisions, final report. Full gate suite + e2e.

Each slice: gates green → commit → push (standing instruction).

## Rollout / rollback (07)

Ship dark: no non-Gemini provider enabled by default; production config unchanged ⇒ behavior unchanged. Enable per step via env after benchmark review. Rollback: env-only (reset route vars). No migrations, no data.

## Readiness gaps accepted

- Live multi-provider benchmarking requires the owner's API keys for the researched providers; mock mode ships CI-green regardless.
- Anthropic adapter deferred by decision D3 (documented) unless benchmark demand emerges.
