<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/summaries/configuration.md -->

# Configuration Summary — Env Schema, Key Groups, Fail-Fast, Mirror Rule

## Approach

- **Backend**: every env var is defined once in `apps/api/src/config/env.schema.ts` (zod, ~50 vars; numeric bounds in `env-bounds.constants.ts` — cross-side values aliased from `@twinzy/shared` so sides can't drift). `validateEnv` **crashes startup** on invalid config; a superRefine enforces `STREAM_TTL_MS >= ANALYSIS_TIMEOUT_MS`. `AppConfigService` (`app-config.service.ts`) is the only injectable surface; `process.env` reads are lint-confined to `src/config` + `src/bootstrap/fastify-adapter.ts` (TRUST_PROXY, pre-DI). Env files: `apps/api/.env` then repo root; `process.env` wins.
- **Frontend**: `publicEnv` (`apps/web/src/packages/env/public-env.ts`) is the only sanctioned client `process.env` reader — zod-validated `NEXT_PUBLIC_*` values; raw reads banned by `no-process-env-outside-config`.
- Canonical human-readable table: `docs/env-vars.md`. Add-a-variable procedure: `skills/add-config-value.md` (schema → getter → `.env.example` → docs, same change).

## Key groups (defaults in parentheses; full table in the schema)

**Platform**: `NODE_ENV` (development), `API_PORT` (4000), `TRUST_PROXY` (false), `CORS_ALLOWED_ORIGINS` (http://localhost:3000; empty = CORS closed), `LOG_LEVEL` (info), `ENABLE_SWAGGER` (tri-state; default `!isProduction`), `RATE_LIMIT_TTL_MS`/`RATE_LIMIT_MAX` (60000/30).

**AI** (details: `knowledge/summaries/ai-pipeline.md`): `GEMINI_API_KEY`, `GEMINI_MODEL` + `GEMINI_FALLBACK_MODELS` (global chain), `GEMINI_MODEL_{EXTRACTION,GENERATION,JUDGE,TRANSLATION}` + per-step fallbacks, `AI_ROUTE_<STEP>` (provider:model chains, ≤10, parse errors throw at boot), `{OPENAI,DEEPSEEK,QWEN,KIMI,GLM}_{API_KEY,BASE_URL}` (key presence = provider enabled), shadow `AI_SHADOW_{ENABLED,SAMPLE_RATE,TIMEOUT_MS}` + `AI_SHADOW_ROUTE_{GENERATION,JUDGE,TRANSLATION}`, `GEMINI_TIMEOUT_MS` (30000), `GEMINI_STREAM_IDLE_TIMEOUT_MS` (60000), `AI_MAX_RESPONSE_BYTES` (500000).

**Payments**: `PAYPAL_CLIENT_ID` + `PAYPAL_CLIENT_SECRET` ('' — **both non-empty ⇒ paywall ON**; blank default = free game), `PAYPAL_ENV` (sandbox|live, default sandbox), `PAYMENT_PRICE_VALUE` (regex `^\d{1,6}\.\d{2}$`, '0.50', server-authoritative), `PAYMENT_PRICE_CURRENCY` (ISO-4217, 'USD').

**Upload / scan**: `MAX_IMAGE_SIZE_BYTES` (shared 5 MiB default, capped by the 10 MiB transport ceiling), `ENABLE_CLAMAV` (false), `CLAMAV_HOSTS` ('127.0.0.1,clamav' — ordered, first reachable cached), `CLAMAV_PORT` (3310).

**Streaming / concurrency**: `MAX_GLOBAL_ACTIVE_ANALYSES` (50), `MAX_ACTIVE_ANALYSES_PER_IP` (3), `MAX_ACTIVE_ANALYSES_PER_TAB` (1), `MAX_ANALYSIS_QUEUE_SIZE` (100), `ANALYSIS_TIMEOUT_MS` (120000), `STREAM_TTL_MS` (180000, must be ≥ watchdog).

**Parallel AI pipeline** (Release A, off by default; details: `docs/ai/concurrency-policy.md` + `architecture/adrs/adr-004-parallel-ai-pipeline.md`): `AI_PARALLEL_PIPELINE_ENABLED` (false), `AI_GENERATION_LANES` (2, 1–6), `AI_GENERATION_CONCURRENCY` (2, 1–16, global per-step gate), `AI_JUDGE_CONCURRENCY` (1, 1–16, provisions Release B), `AI_MAX_CALLS_PER_ANALYSIS` (5, 3–20, extraction+lanes+judge), `AI_PARALLEL_QUEUE_TIMEOUT_MS` (30000, 1000–120000, lane permit wait).

**Share**: `SHARE_RESULT_TTL_SECONDS` (600, bounds 60–3600 from shared), `SHARE_RESULT_MAX_PAYLOAD_BYTES` (50000), `SHARE_RESULT_MAX_ACTIVE_ITEMS` (1000), `SHARE_RESULT_PUBLIC_BASE_URL` (z.url(), server config only — never user input).

**Web public (`NEXT_PUBLIC_*`, via `publicEnv`)**: `NEXT_PUBLIC_APP_ENV` (local|test|staging|production), `NEXT_PUBLIC_API_BASE_URL` (default http://localhost:4000), `NEXT_PUBLIC_PAYPAL_ME_USERNAME` (regex `^[A-Z0-9]{1,50}$/i`; empty hides the donate link), `NEXT_PUBLIC_PAYPAL_CLIENT_ID` (regex `^[\w-]{20,120}$`; empty = paywall UI off), `NEXT_PUBLIC_PAYMENT_PRICE_VALUE`/`_CURRENCY` (display-only mirrors — the server price is authoritative).

## Standing rules

- Required-is-required: no silent fallbacks for keys/model names; an empty Gemini chain throws at call time rather than defaulting (`gemini.adapter.ts`).
- Named flags, not ambient `NODE_ENV` logic (`ENABLE_CLAMAV`, `ENABLE_SWAGGER`) — `rules/25-configuration-and-environment.md`.
- **`.env.example` mirror rule**: schema change + getter + `.env.example` row + `docs/env-vars.md` row ship in the same change; "a variable that is not in `.env.example` does not exist". Local `.env` must be updated when `.env.example` changes (user memory: env-example-sync).
- Known `.env.example` inconsistencies to reconcile (recorded in `knowledge/summaries/current-risks.md`): mismatched `PAYMENT_PRICE_VALUE` (0.01) vs `NEXT_PUBLIC_PAYMENT_PRICE_VALUE` (0.50), `PAYPAL_ENV=live` example vs sandbox default, and a stale "paid gating remains forbidden" comment.
