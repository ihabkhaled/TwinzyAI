---
id: summary-ai-pipeline
title: AI Pipeline Summary — Steps, Providers, Routing, Safety, Prompts, Env Knobs
type: summary
authority: canonical
status: current
owner: repository owner
generated: false
summary: Routing digest of the AI pipeline — the four env-routable steps, provider adapters and routing precedence, the layered safety chain, prompt files, and every cost/latency env knob.
keywords: [ai, pipeline, gemini, providers, routing, shadow, prompts, safety, zod validation, timeouts, benchmark, parallel, lanes, fan-out, concurrency-gate]
contextTier: 1
relatedCode: [apps/api/src/modules/ai/adapters/ai-router.service.ts, apps/api/src/modules/ai/adapters/gemini.adapter.ts, apps/api/src/modules/ai/application/ai-safety.service.ts, apps/api/src/config/gemini-step.constants.ts, apps/api/src/modules/ai/application/candidate-recall.service.ts, apps/api/src/modules/ai/application/ai-step-concurrency.gate.ts]
relatedTests: [apps/api/src/modules/ai/tests/ai-pipeline.test.ts, apps/api/src/modules/ai/tests/ai-router.service.test.ts, apps/api/src/modules/ai/tests/candidate-recall.service.test.ts]
relatedDocs: [docs/provider-routing.md, docs/ai-safety.md, docs/ai-benchmarking.md, rules/14-ai-safety.md, docs/ai/concurrency-policy.md, architecture/adrs/adr-004-parallel-ai-pipeline.md]
readWhen: You are touching AI steps, provider adapters, routing/shadow config, prompts, or the safety chain.
---

# AI Pipeline Summary — Steps, Providers, Routing, Safety, Prompts, Env Knobs

## Steps and the image boundary

Four env-routable steps — extraction, generation, judge, translation (`GeminiStep` in `apps/api/src/config/gemini-step.constants.ts`). `AI_IMAGE_STEPS = [extraction]` is the ONLY photo-carrying step. The boundary is **typed** (`generateFromImage*` vs image-less `generateFromText*` on the `AiProviderAdapter` port, `modules/ai/model/ai-provider-adapter.types.ts`), **lint-enforced** (`architecture/application-layer-boundaries` — image calls only from `trait-extraction.service.ts`), and **fail-closed at routing**: `provider-registry.service.ts` `usableEntriesFor` hardcodes that photo-carrying calls dispatch only to Gemini entries. Stage flow and entities: `knowledge/summaries/domain.md`.

## Providers and routing

- `AiRouterService` (bound to the `AI_PROVIDER_ADAPTER` token) walks the step's env-configured `provider:model` chain; hops to the next entry only on `AiRateLimited | AiProviderUnavailable | AiTimeout | AiResponseInvalid` (`model/ai-router.constants.ts`); exhaustion ⇒ 429 if any hop rate-limited, else 502; aborts propagate immediately.
- `GeminiAdapter` — the only `@google/genai` importer: model-chain retry, total timeout + streaming idle timeout, response byte cap, temperature 0.4, JSON mime, provider errors redacted via `redactForLog`.
- `OpenAiCompatAdapter` — one fetch-based adapter for openai/deepseek/qwen/kimi/glm (`/chat/completions`, `response_format: json_object`); image methods always reject; instantiated per enabled provider (API-key presence = enabled). Default base URLs: `apps/api/src/config/ai-provider.constants.ts`.
- Route precedence (`app-config.service.ts`): `AI_ROUTE_<STEP>` (comma `provider:model` list, bare token = `gemini:<model>`, ≤10 entries, parse errors throw at boot) **replaces** per-step `GEMINI_MODEL_<STEP>`+fallbacks, which **replaces** the global `GEMINI_MODEL`+`GEMINI_FALLBACK_MODELS` chain. Rollback is env-only. Doc: `docs/provider-routing.md` (verified accurate).
- Shadow mode: sampled, metrics-only, **text steps only** (no extraction shadow key exists); `AI_SHADOW_ENABLED/SAMPLE_RATE/TIMEOUT_MS` + `AI_SHADOW_ROUTE_{GENERATION,JUDGE,TRANSLATION}`; one log line, failures swallowed, output never reaches users (`adapters/ai-shadow.service.ts`).

## Parallel candidate recall (Release A, flag-gated — `AI_PARALLEL_PIPELINE_ENABLED`, default off)

`application/candidate-recall.service.ts` owns the single-vs-parallel strategy: flag off ⇒ one unchanged generation call; flag on ⇒ fan out into `AI_GENERATION_LANES` (2) text-only lanes, each with a distinct recall focus (strongest/diverse/wildcard) appended in code (`lib/candidate-lane-plan.util.ts`) to the unchanged base prompt. Lanes run under `application/ai-step-concurrency.gate.ts` — a process-global per-step `core/concurrency/semaphore.ts` sized by `AI_GENERATION_CONCURRENCY` (2) — clamped to `AI_MAX_CALLS_PER_ANALYSIS` (5 = extraction+lanes+judge). `Promise.allSettled`: a failed/permit-timed-out (`AI_PARALLEL_QUEUE_TIMEOUT_MS`, 30 s) lane is dropped, survivors merge/dedupe deterministically (`lib/candidate-merge.util.ts`, score-desc then name-asc), empty ⇒ same server fallback. Extraction and judge still run exactly once — the image boundary is untouched. `AI_JUDGE_CONCURRENCY` provisions the future Release-B judge tournament. Owner: `docs/ai/concurrency-policy.md` + `architecture/adrs/adr-004-parallel-ai-pipeline.md`. `StyleMatchService` now depends only on `CandidateRecallService` for recall.

## Prompts (`apps/api/src/modules/ai/prompts/`, loaded by `infrastructure/prompt-template.repository.ts`)

`use-1st-prompt.md` (extraction, `[LANGUAGE_CODE]`), `use-2nd-prompt.md` (generation, `[TRAITS_JSON] [LANGUAGE_CODE] [RESULT_COUNT] [REGION_HINT]`), `use-3rd-prompt.md` (judge — owns score calibration), `translate-result-prompt.md`. The repository validates required placeholders, replaces via split/join (no regex injection), and rejects any prompt still containing a known placeholder. Registry: `model/prompt-version.constants.ts`. Contract version `written-traits-v5` is a `z.literal` in every response schema; lock-step drift test at `modules/ai/tests/ai-pipeline.test.ts`.

## Safety chain (layered; owner: `docs/ai-safety.md` + `rules/14-ai-safety.md`)

1. Prompt-level forbidden-wording sections + all-false `safetyCheck` self-reports.
2. Schema-level: `z.literal(false)` safety flags, promptVersion literal, bounded fields — every response Zod-parsed per model **before acceptance** (`buildSchemaValidator`), so a schema-failing model burns a fallback hop, not the request.
3. Language echo guard (`lib/response-language.guard.ts`).
4. Forbidden-wording scan (`lib/forbidden-wording.guard.ts`) over the merged bilingual lists in `packages/shared/src/constants/safety.constants.ts`.
5. Enforcement policy (`application/ai-safety.service.ts`): trait/translation responses rejected whole (`AiResponseUnsafe`); unsafe candidates/judged items dropped individually with graceful fallback.
6. Server-owned disclaimer/fallback copy; aggregation display gate (score ≥70, non-weak verdict, `meetsMinimumEvidence`).

## Env knobs (all in `apps/api/src/config/env.schema.ts`; defaults in `env-bounds.constants.ts`)

- Timeouts/size: `GEMINI_TIMEOUT_MS` (30 s default; reused by the compat adapter), `GEMINI_STREAM_IDLE_TIMEOUT_MS` (60 s inter-chunk), `AI_MAX_RESPONSE_BYTES` (500 k, aborts mid-stream on overflow), `ANALYSIS_TIMEOUT_MS` watchdog (120 s), `STREAM_TTL_MS` (180 s, ≥ watchdog).
- Concurrency (admission): `MAX_GLOBAL_ACTIVE_ANALYSES` 50 / `MAX_ACTIVE_ANALYSES_PER_IP` 3 / `MAX_ACTIVE_ANALYSES_PER_TAB` 1 / `MAX_ANALYSIS_QUEUE_SIZE` 100.
- Parallel recall (Release A, off by default): `AI_PARALLEL_PIPELINE_ENABLED`, `AI_GENERATION_LANES` 2, `AI_GENERATION_CONCURRENCY` 2, `AI_JUDGE_CONCURRENCY` 1, `AI_MAX_CALLS_PER_ANALYSIS` 5, `AI_PARALLEL_QUEUE_TIMEOUT_MS` 30 s.
- Selection: `GEMINI_API_KEY`, `GEMINI_MODEL[_<STEP>]`, `GEMINI_FALLBACK_MODELS[_<STEP>]`, `AI_ROUTE_<STEP>`, `{OPENAI|DEEPSEEK|QWEN|KIMI|GLM}_{API_KEY,BASE_URL}`. Never hardcoded — an empty chain throws `AiProviderUnavailable` rather than defaulting.

## Cancellation and benchmark

Cancel/disconnect/watchdog aborts bridge into in-flight provider calls via `lib/abort-bridge.util.ts` (both adapters); cancel requires exact streamId+tabId+requestId match. Benchmark harness: `npm run ai:benchmark` (mock deterministic/CI-safe; `--mode=real` is billed) reuses production validators; score = schema 0.5 / safety 0.3 / speed 0.2 — `docs/ai-benchmarking.md`.

Known code-comment drift (code is correct, comments stale): env.schema.ts "vision declarations" block; `result-aggregation.service.ts` "caps at 5"; `matching-evidence.types.ts` "alongside the photo"; the SSE `heartbeat` schema event is unexercised — the wire uses comment keep-alives.
