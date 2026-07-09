# 08 - Architecture Review: Current State → Provider-Agnostic Routing

## Current state (investigated 2026-07-09)

The investigation found the codebase already **80% provider-agnostic** — the pivot work and the per-step model chains (commit `66c260b`) put the right seams in place:

- **Port**: `AiProviderAdapter` (`modules/ai/model/ai-provider-adapter.types.ts`) is generic: `generateFromImage/Text[Stream](prompt, [image,] options)`. Options carry `{ validate, step, onChunk, signal }`. No Gemini types leak through the port; adapter methods take/return plain strings + app-owned types.
- **Binding**: single implementation (`GeminiAdapter`) bound to the `AI_PROVIDER_ADAPTER` symbol in the AI module. The adapter is the only file importing `@google/genai` (mechanically enforced by `architecture/no-direct-sdk-imports`).
- **Per-step routing (models only)**: `AppConfigService.geminiModelChainFor(step)` resolves a per-step model chain from env (`GEMINI_MODEL_<STEP>`/`GEMINI_FALLBACK_MODELS_<STEP>`), falling back to the global chain. The adapter walks the chain on retryable errors AND on content-validation failure (invalid JSON/schema), logging privacy-safe reasons.
- **Validation/safety**: every step Zod-parses (`parseAiJsonResponse`) and safety-filters (`AiSafetyService`) INDEPENDENTLY of the provider — nothing provider-specific in that layer. Provider content-level validation happens inside the chain walk via `buildSchemaValidator` (paths-only diagnostics).
- **Image discipline**: the image reaches the adapter only through `*FromImage*` methods; extraction/generation/judge are multimodal by product design (owner-approved pivot); translation is text-only and the backend restores canonical fields. Image bytes are never logged/persisted; buffer zero-filled in `finally`.
- **Errors**: provider errors are classified (`provider-error.util`) into retryable/terminal kinds and normalized into the app's typed error envelope (`AI_RATE_LIMITED`, `AI_PROVIDER_UNAVAILABLE`, `AI_TIMEOUT`, `AI_RESPONSE_INVALID`) — already provider-neutral.
- **Timeouts**: `GEMINI_TIMEOUT_MS` (non-stream) + `GEMINI_STREAM_IDLE_TIMEOUT_MS` (inter-chunk idle) enforced inside the adapter via AbortController; external cancel signal bridged in.
- **Tests**: pipeline tests run against `FakeAiAdapter` (implements the port, records steps) — NOT tied to Gemini internals. Adapter-specific tests stub the SDK client structurally.

### Gaps blocking multi-provider

1. Routes are **model ids only** — no provider dimension; one adapter bound for everything.
2. No **capability model** — nothing prevents routing an image step to a text-only provider/model.
3. Fallback cannot **cross providers**.
4. No **shadow** execution, no **benchmark** harness.
5. Config exposes Gemini-shaped getters only; no per-provider credentials/enable flags.

## Target architecture

```
Step service (extraction | generation | judge | translation)
  → AiRouterService  (bound to AI_PROVIDER_ADAPTER — same port, so services change ~zero)
      · resolves the step's ROUTE CHAIN from config: ordered entries "provider:model"
      · validates capability per entry (image call → entry's model must be vision-capable;
        disabled provider / missing key → entry skipped at startup validation)
      · walks the chain across providers: retryable provider error OR content-validation
        failure → next entry (same semantics the Gemini chain has today, now cross-provider)
      · normalizes errors; logs "Step <step> served by <provider>:<model>"
      · shadow hook: sampled, fire-and-forget, metrics-only, never affects the result
  → ProviderRegistry  (provider id → adapter instance + enablement)
      · gemini → GeminiAdapter (unchanged behavior, kept as-is)
      · openai-compatible family → OpenAiCompatAdapter instances parameterized by
        { baseUrl, apiKey, provider id } — one adapter class serves OpenAI, DeepSeek,
        Qwen (DashScope-intl), Kimi (Moonshot), GLM (Z.ai), all of which expose
        OpenAI-compatible chat-completions endpoints (research-confirmed)
  → Capability registry (config-derived): per provider:model → { vision, jsonMode, … }
```

Key decisions (ADR-level):

- **D1 — Router implements the existing port.** Services already declare their step and consume `AiProviderAdapter`; re-binding `AI_PROVIDER_ADAPTER` to the router keeps every service, test double, and safety layer untouched. The Gemini adapter becomes one registry entry (provider `gemini`).
- **D2 — Route syntax `provider:model`** in env (e.g. `AI_ROUTE_JUDGE=gemini:gemini-3.5-flash,openai:gpt-5-mini`). Bare model ids (no colon) mean `gemini:` for backward compatibility, so the existing `GEMINI_MODEL*` config keeps working unchanged (Gemini-only config = valid production config).
- **D3 — One OpenAI-compatible adapter, many providers.** OpenAI, DeepSeek, Qwen, Kimi, and GLM all speak the chat-completions protocol; a single adapter parameterized by base URL + key covers them with native `fetch` — **zero new dependencies** (satisfies the no-new-dependency rule; Anthropic's distinct protocol would be its own adapter later if benchmarks justify it).
- **D4 — Vision capability is config-declared, fail-closed.** A route entry used by an image step must be declared vision-capable in the capability config; unknown/undeclared models are treated as text-only, so a photo can never be sent to a provider that wasn't explicitly marked as allowed to receive it (privacy stance: photos only go where the operator consciously allowed).
- **D5 — Shadow is sampled + isolated.** Shadow runs never touch the request outcome, run after the primary result resolves (fire-and-safe with try/catch + own timeout), respect a sample rate, capture metrics only (validity/schema/safety/latency), never log content, and never receive the image unless the shadow entry is vision-capable AND shadow-image is explicitly enabled.
- **D6 — Benchmark is a script, not a runtime mode.** `npm run ai:benchmark` (scripts/ai-benchmark.mjs → compiled runner) executes the step matrix against fixtures; mock mode needs no keys (CI-safe), real mode is explicit and warns about cost. It reads the same capability/route config; it never auto-writes production config.

## Boundary/contract changes

- `AI_PROVIDER_ADAPTER` binding changes from GeminiAdapter to AiRouterService (module wiring only).
- New config surface (see 10/13): route chains per step, provider credentials/base URLs/enable flags, capability declarations, shadow + benchmark settings. All optional; absent = today's Gemini behavior.
- No public API contract changes; no frontend changes; no shared-schema changes to responses.

## Architecture risks

- R1: Chat-completions dialect drift between "compatible" providers (message shapes for images differ subtly) → adapter keeps per-provider quirks table small + benchmark validates each enabled combination.
- R2: Cross-provider fallback could mask systematic prompt problems → per-step "served by" logs + benchmark keep drift visible.
- R3: Config surface growth → every var validated by zod, documented in `.env.example` + `docs/provider-routing.md`, and startup fails fast on invalid routes.
