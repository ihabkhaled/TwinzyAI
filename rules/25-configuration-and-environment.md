# 25 — Configuration & Environment

> All configuration is typed, zod-validated at startup, and read through `@nestjs/config` behind **`AppConfigService` — the only injectable config surface**. `process.env` never appears outside `config/` and `bootstrap/` (ESLint-enforced: `architecture/no-direct-env-access`). A misconfigured process refuses to boot — loudly — rather than failing later mid-request. Implements rules 26 and 28 of [00-non-negotiable-rules.md](./00-non-negotiable-rules.md).

---

## The one boundary that matters

`process.env` is raw, untyped, stringly, globally mutable. It stays at the edge:

| Layer | May touch `process.env`? | Instead |
| --- | --- | --- |
| `src/config` | **Yes** — the only place (incl. `dotenv` loading) | reads, parses, zod-validates, exposes typed access |
| `src/bootstrap` | **Yes** — startup wiring only | pre-DI values needed to assemble the app |
| Everything else (controllers, use cases, services, adapters, modules, web business code) | **No** | inject `AppConfigService` (web: `lib/config`, `NEXT_PUBLIC_*` only) |

```ts
// DON'T — raw env read buried in a service: untyped, unvalidated, lint error
private readonly model = process.env.GEMINI_MODEL; // undefined at runtime? NaN? who knows

// DO — the typed surface; the value is guaranteed present and shaped
constructor(private readonly config: AppConfigService) {}
this.config.geminiModel; // validated string, fail-fast at boot
```

## Validate at startup, fail fast

`src/config/env.schema.ts` is the zod schema every boot passes through; `env.loader.ts` applies it. An invalid or missing required value throws and exits non-zero **before** the app listens.

```ts
// config/env.schema.ts (shape)
export const EnvSchema = z
  .object({
    NODE_ENV: z.enum(NODE_ENV_VALUES),
    PORT: z.coerce.number().int().min(1).max(65535),
    GEMINI_API_KEY: z.string().min(1),
    GEMINI_MODEL: z.string().min(1),          // ALWAYS from .env — never hardcoded anywhere
    GEMINI_TIMEOUT_MS: z.coerce.number().int().positive(),
    MAX_IMAGE_SIZE_BYTES: z.coerce.number().int().positive(),
    ENABLE_CLAMAV: z.coerce.boolean(),
    ENABLE_OPENAPI_DOCS: z.coerce.boolean().default(false),
    CORS_ORIGINS: z.string().min(1),           // parsed to an allowlist in config
    LOG_LEVEL: z.enum(LOG_LEVEL_VALUES).default(LogLevel.INFO),
  })
  .strict();
```

Rules to honor:

- **Required is required.** No silent fallback for values the app genuinely needs (API keys, model name). Defaults exist only for operational tuning (timeouts, log level) — never for secrets or correctness.
- **Coerce explicitly in the schema** (`z.coerce.*`) — env is always strings; conversion never happens with scattered `Number(...)`/`=== 'true'` in business code.
- **Constrain**: ports bounded, sizes positive, enums via the as-const `*_VALUES` tuples ([05-types-enums-constants.md](./05-types-enums-constants.md)). A port of `0` must not boot.
- **No environment-conditional business logic.** Behavior gates through explicit named config values (`ENABLE_CLAMAV`, `ENABLE_OPENAPI_DOCS`), not ambient `NODE_ENV === 'production'` sprinkled around; the one sanctioned production gate (ClamAV fail-closed) reads the validated value.

## `AppConfigService` — the only injectable surface

Business code injects `AppConfigService` and reads typed getters — never the raw `ConfigService` with stringly `.get('KEY')`, never the schema output directly. Adapters take their settings via injected config, they never read env ([10-library-modularization.md](./10-library-modularization.md)). Adding a value means: schema entry + `AppConfigService` getter + `.env.example` line + docs, **in the same change**.

## Special values (standing decisions)

- **`GEMINI_MODEL`** comes from `.env` via config — hardcoding a model name anywhere (source, tests, prompts, docs-as-code) is a review blocker.
- **`ENABLE_CLAMAV`** + environment drive the fail-closed policy ([15-file-upload-security.md](./15-file-upload-security.md)).
- **`ENABLE_OPENAPI_DOCS`** flag-gates swagger (`core/openapi`); off by default outside local.
- **`AI_PARALLEL_*` knobs** — the six parallel-pipeline vars (`AI_PARALLEL_PIPELINE_ENABLED`, `AI_GENERATION_LANES`, `AI_GENERATION_CONCURRENCY`, `AI_JUDGE_CONCURRENCY`, `AI_MAX_CALLS_PER_ANALYSIS`, `AI_PARALLEL_QUEUE_TIMEOUT_MS`) follow the same validated-config pattern (zod schema + `env-bounds.constants.ts` bounds + typed `AppConfigService` getters); flag `false` by default ([/docs/ai/concurrency-policy.md](../docs/ai/concurrency-policy.md)).
- Frontend receives **`NEXT_PUBLIC_*` only**, read through `lib/config` — no server value ever reaches the bundle.

## Secrets

Never committed (`.env` git-ignored; `.env.example` tracked with `change-me` placeholders); injected at runtime per environment; never logged (redaction — [22-observability-logging.md](./22-observability-logging.md)); never echoed in errors (sanitized envelope — [26-error-handling-and-exceptions.md](./26-error-handling-and-exceptions.md)). Rotation notes live in [/memory/security-decisions.md](../memory/security-decisions.md).

## `.env.example` discipline

The documented contract of every variable the app reads: same names, grouped by concern, one-line comment each, required-vs-optional marked, placeholders only. Adding/removing/renaming a variable updates schema + service + `.env.example` + docs in the same change — a drifted example is a setup trap and a release blocker ([24-release-gate.md](./24-release-gate.md)).

---

## Checklist

- [ ] No `process.env` outside `config/`/`bootstrap/` (lint green proves it)
- [ ] Every variable in the zod env schema — typed, constrained, coerced explicitly, `.strict()`
- [ ] Required values fail fast at boot; defaults only for tuning
- [ ] Business code injects `AppConfigService` only; adapters never read env
- [ ] `GEMINI_MODEL` never hardcoded anywhere
- [ ] No ambient `NODE_ENV` business logic — named flags/config values only
- [ ] `.env.example` in sync in the same change; secrets never committed/logged/echoed
