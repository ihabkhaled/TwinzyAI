# Architecture Map — The Canonical Twinzy Backend Architecture

> This is the **single source of truth** for how `apps/api` is structured. Every rule in [`/rules`](../rules/README.md), every skill in [`/skills`](../skills/README.md), every reviewer in [`/agents`](../agents/README.md), and the custom ESLint architecture plugin in [`/eslint`](../eslint/architecture.config.mjs) agree with this document. If anything contradicts it, this file and [`/rules/00-non-negotiable-rules.md`](../rules/00-non-negotiable-rules.md) win — together they are the engineering canon.

The repo is an npm-workspaces monorepo: `apps/api` (NestJS 11 on Fastify), `apps/web` (Next.js — summarized in §8, governed by its own rules), and `packages/shared` (`@twinzy/shared` — zod schemas, constants, as-const enums, types; consumed as **built dist** via a workspace dependency, no TS path alias; root scripts run `build:shared` first). There is **no database by design**: nothing user-derived is persisted, and the only "repository" is a bounded read-only template store.

---

## 1. The layers (and the one-way dependency rule)

Dependencies point **inward and downward only**. A layer may depend on the layers below it, never on the layers above it.

```
        ┌──────────────────────────────────────────────────────────────┐
HTTP →  │ Transport        controllers (api/*.controller.ts)            │  thin, one delegation
        │                  DTO schemas (api/dto/*.dto.ts — zod)         │  boundary shapes only
        ├──────────────────────────────────────────────────────────────┤
        │ Application      use cases (application/*.use-case.ts)        │  multi-step orchestration
        │                  services  (application/*.service.ts)         │  focused capabilities (≤20 lines/method)
        ├──────────────────────────────────────────────────────────────┤
        │ Infrastructure   repositories (infrastructure/*.repository.ts)│  bounded read-only stores (no DB by design)
        ├──────────────────────────────────────────────────────────────┤
        │ Integration      adapters (adapters/*.adapter.ts)             │  wrap every external SDK/daemon
        ├──────────────────────────────────────────────────────────────┤
        │ Declarations     model/ (types, as-const enums, constants,    │  no inline domain definitions anywhere else
        │ + pure helpers   ports, tokens) and lib/ (pure functions)     │
        └──────────────────────────────────────────────────────────────┘
   Cross-cutting (importable everywhere): src/bootstrap, src/config, src/core
   Shared contracts (both apps): packages/shared (@twinzy/shared)
```

### Layer responsibilities (one line each)

| Layer | Owns | Must NOT |
| --- | --- | --- |
| **Controller** (`api/*.controller.ts`) | Parse/shape HTTP, apply throttle/interceptors/pipes, delegate to exactly **one** application-layer call | Contain business logic, branching, transformation, or import adapters/infrastructure |
| **DTO** (`api/dto/*.dto.ts`) | Zod request/response schemas at the HTTP boundary, derived from or composed with `@twinzy/shared` schemas | Import services, adapters, or infrastructure |
| **Use case** (`application/*.use-case.ts`) | Orchestrate **one** business operation across services/adapters; own resource lifecycles (e.g. the image-buffer wipe in `finally`) | Import controllers or parse HTTP |
| **Service** (`application/*.service.ts`) | A focused, reusable capability; may use repositories and adapters; methods ≤ ~20 lines | Import controllers; call use cases; hold inline types/consts |
| **Repository** (`infrastructure/*.repository.ts`) | Bounded, read-only resource access (e.g. the prompt template store — the only place with `fs` access) | Hold business policy or persist anything user-derived (no DB by design) |
| **Adapter** (`adapters/*.adapter.ts`) | Wrap a single external SDK/daemon (Gemini, ClamAV) behind a typed app-owned port | Leak vendor types into business code |
| **`model/`** | Types, as-const enums + `*_VALUES`, constants, port interfaces + `Symbol` injection tokens | Contain executable logic |
| **`lib/`** | Pure, deterministic helpers (sanitizers, guards, parsers, mappers) | Do I/O or hold state |
| **Config** (`src/config/`) | The **only** place (with `src/bootstrap/`) that reads `process.env`; zod-validated, typed, fail-fast | Be bypassed by ad-hoc `process.env` reads |

These responsibilities are **enforced by ESLint** via the custom `architecture/*` rules (see §6).

---

## 2. Canonical source tree (`apps/api/src`)

```
apps/api/src/
├── main.ts                              # entrypoint → bootstrap()
├── app.module.ts                        # root module: config, core, feature modules
├── bootstrap/                           # app assembly (process.env allowed here)
│   ├── bootstrap.ts                     # top-level boot sequence
│   ├── create-app.ts                    # NestFactory + module wiring
│   ├── fastify-adapter.ts               # Fastify: bounded body, trustProxy, UUID genReqId
│   ├── configure-security.ts            # helmet, CORS, cookies
│   ├── configure-validation.ts          # global zod pipe registration
│   ├── configure-swagger.ts             # flag-gated OpenAPI wiring
│   ├── configure-lifecycle.ts           # shutdown hooks, listen
│   └── bootstrap.constants.ts
├── config/                              # @nestjs/config + zod fail-fast (process.env allowed here)
│   ├── env.schema.ts                    # zod schema — single source of truth for env vars
│   ├── app-config.service.ts            # typed getter surface over @nestjs/config
│   └── config.module.ts
├── core/                                # cross-cutting infrastructure (importable everywhere)
│   ├── logger/                          # AppLogger + AppLoggerPort over nestjs-pino + redaction
│   ├── errors/                          # AppError hierarchy, app-exception.filter.ts,
│   │                                    #   error-code.constants.ts, legacy compat shims
│   ├── validation/                      # zod validation pipe + issue flattening + logging
│   ├── rate-limit/                      # @nestjs/throttler ownership (defaults from config)
│   ├── openapi/                         # flag-gated swagger module
│   └── http/                            # structural HttpReplyLike + multipart types + upload interceptor
└── modules/
    ├── health/                          # GET /api/v1/health
    │   ├── api/health.controller.ts
    │   ├── application/health.service.ts
    │   └── model/health.constants.ts
    ├── game/                            # POST /api/v1/game/analyze (multipart, throttled 10/min)
    │   ├── api/game.controller.ts
    │   ├── api/dto/analyze-request.dto.ts
    │   ├── application/analyze-game.use-case.ts
    │   └── model/                       # throttle + upload constants
    ├── ai/
    │   ├── adapters/gemini.adapter.ts   # the ONLY file importing @google/genai
    │   ├── application/                 # trait-extraction, candidate-generation,
    │   │                                #   candidate-judge, ai-safety services
    │   ├── infrastructure/prompt-template.repository.ts  # bounded read-only template store (fs lives here)
    │   ├── prompts/                     # use-1st/2nd/3rd-prompt.md — module resources
    │   ├── model/                       # constants, enums, types, prompt version,
    │   │                                #   AI provider port + injection token
    │   └── lib/                         # forbidden-wording.guard, ai-response-sanitizer, json-response.util
    ├── file-security/
    │   ├── application/                 # file-security, file-validation, magic-byte-validation,
    │   │                                #   image-decode-validation, virus-scan, temporary-file-cleanup
    │   ├── adapters/clamav.adapter.ts
    │   ├── lib/image-dimensions.util.ts
    │   └── model/                       # constants + upload-file types
    ├── privacy/
    │   ├── application/log-redaction.service.ts
    │   └── lib/log-redaction.util.ts
    └── result-aggregation/
        ├── application/result-aggregation.service.ts
        └── lib/                         # extracted filters/mappers as they grow
```

> Modules use **relative imports** internally and import shared contracts from `@twinzy/shared` (the built dist of `packages/shared`). There are no `@core/@modules` TS path aliases in the API workspace.

---

## 3. Module anatomy (the unit you scaffold)

Every feature module mirrors the layers. A module imports `src/core`, `src/config`, `@twinzy/shared`, and its **own** internals — never another module's internals (consume another module through its `index.ts` public surface).

```
apps/api/src/modules/<feature>/
├── <feature>.module.ts              # wires controllers + providers; declares the public surface
├── index.ts                         # public API barrel (what other modules may import)
├── api/
│   ├── <feature>.controller.ts      # thin transport: one delegation per method
│   └── dto/<action>.dto.ts          # zod schema + inferred type (backed by @twinzy/shared)
├── application/
│   ├── <action>.use-case.ts         # multi-step orchestration (escalation only — see below)
│   └── <capability>.service.ts      # focused capability (default unit of work)
├── infrastructure/
│   └── <resource>.repository.ts     # bounded read-only resource store (only if needed)
├── adapters/
│   └── <vendor>.adapter.ts          # the only file importing that vendor SDK
├── model/
│   ├── <feature>.types.ts
│   ├── <feature>.enums.ts           # as-const object + *_VALUES + derived type
│   ├── <feature>.constants.ts
│   └── <port>.port.ts               # port interface + Symbol injection token
├── lib/
│   └── <feature>.<concern>.ts       # pure helpers, mappers, guards
├── prompts/                         # module resources (ai module only)
└── tests/                           # *.test.ts colocated per module
```

### Service vs. use case — when to escalate

- **Default = Service.** A focused capability that does one thing: validate a file, extract traits, judge candidates, aggregate results. A service may inject repositories and adapters. Methods stay ≤ ~20 lines.
- **Escalate to a Use case** only for the exceptional shape: **one operation that orchestrates multiple modules in a mandatory order and owns a resource lifecycle.** The canonical example is `analyze-game.use-case.ts`: consent check → file-security chain → trait extraction (the only image-facing step) → **image buffer wipe in `finally`** → text-only candidate generation → judge → aggregation with fallback. There are no DB transactions here; the escalation trigger is ordered cross-module orchestration plus guaranteed cleanup.
- **Use cases call services; services never call use cases** (one-way). Pass-through tiers are banned: if a class only forwards a call (as the old health "manager" did), dissolve it and let the controller delegate straight to the service.

---

## 4. NestJS building blocks → where they live

| NestJS concept | Home | Notes |
| --- | --- | --- |
| `@Controller` | `api/*.controller.ts` | Thin; `@Throttle`, upload interceptor, zod pipe only |
| `@Injectable` provider | `application/*.service.ts` / `*.use-case.ts` | Constructor DI; `private readonly` deps |
| Guard | `core/rate-limit/` (throttler) | No auth — the game is anonymous and free |
| Interceptor | `core/http/` (upload interceptor) | Multipart handling on Fastify |
| Pipe | `core/validation/` (zod pipe) | Registered globally in `bootstrap/configure-validation.ts` |
| Exception filter | `core/errors/app-exception.filter.ts` | Sanitized envelope: `ErrorCode` + additive `messageKey` |
| Module | `<feature>.module.ts`, `app.module.ts` | Wiring + public surface |
| Config | `src/config/` | `@nestjs/config` + zod fail-fast (`env.schema.ts`) |
| Repository | `infrastructure/*.repository.ts` | Bounded read-only stores only — no DB by design |
| Port + token | `model/*.port.ts` | Interface + `Symbol(...)` token; bind with `{ provide: TOKEN, useClass: Adapter }` |

---

## 5. Cross-cutting contracts (the non-negotiable conventions)

- **Errors:** every user-facing failure is a typed `AppError` subclass — `ValidationError` 400, `UnauthorizedError` 401, `ForbiddenError` 403, `NotFoundError` 404, `ConflictError` 409, `PayloadTooLargeError` 413, `IntegrationError` 502 — carrying a `messageKey` of the form `errors.<feature>.<key>`. The global filter in `core/errors` returns the sanitized envelope compatible with `ApiErrorResponse` (`statusCode`, stable legacy `errorCode`, `message`; `messageKey` added additively). No stack traces, provider errors, or file contents ever leak. ([rules/16](../rules/16-backend-architecture.md), [rules/22](../rules/22-observability-logging.md))
- **Config:** read configuration through the typed config service (`@nestjs/config` + `env.schema.ts` zod fail-fast). `process.env` only in `src/config` and `src/bootstrap`. `GEMINI_MODEL` always comes from env — never hardcoded. ([rules/00](../rules/00-non-negotiable-rules.md))
- **Logging:** nestjs-pino behind the `AppLogger` port (`core/logger`), never `console.*`. Redaction is mandatory; no image bytes, prompts, or PII in logs. ([rules/22](../rules/22-observability-logging.md))
- **Validation:** **zod everywhere** — never class-validator. HTTP boundary DTOs are strict zod objects (unknown keys rejected = whitelist behavior) in `api/dto`, backed by `packages/shared` schemas; the zod pipe in `core/validation` flattens and logs issues. ([rules/21](../rules/21-dto-validation.md))
- **Domain values:** no TypeScript `enum` keyword — as-const objects + `*_VALUES` arrays + derived types, in `model/` or `packages/shared`. ([rules/05](../rules/05-types-enums-constants.md))
- **Zero inline domain definitions:** no types/interfaces/enums/constants/DTOs/schemas declared inside controllers/services/use-cases/adapters/repositories — they live in `model/`, `api/dto/`, `lib/`, or `packages/shared`. ([rules/05](../rules/05-types-enums-constants.md))
- **Vendor wrapping:** every external library sits behind an adapter or wrapper; `@google/genai` is imported **only** by `gemini.adapter.ts`, ClamAV is reached only through `clamav.adapter.ts`. Swapping a vendor touches exactly one folder. ([rules/10](../rules/10-library-modularization.md))
- **Bounded lists:** every list an endpoint or service produces is hard-capped (max 100 items; the game pipeline itself caps at 5 candidates / 4 displayed results). No unbounded accumulation in the in-memory stores. ([rules/07](../rules/07-performance-scalability.md))
- **AI safety:** only the trait-extraction step sees the image; candidate/judge prompts are text-only; responses are zod-validated then safety-filtered; the image buffer is wiped in `finally`. No face recognition, no identity matching, no biometrics, no image storage — ever. ([rules/14](../rules/14-ai-safety.md), [rules/15](../rules/15-file-upload-security.md))
- **Tests + docs:** no behavior change ships without updated tests and docs. ([rules/09](../rules/09-testing-coverage.md), [rules/00](../rules/00-non-negotiable-rules.md))

---

## 6. How the architecture is enforced (ESLint)

The custom plugin under [`/eslint/architecture-plugin`](../eslint/architecture-plugin/rules/controller-no-logic.mjs) with config in [`/eslint/architecture.config.mjs`](../eslint/architecture.config.mjs) mechanically enforces this map. Target: **0 errors AND 0 warnings.**

- **`architecture/controller-no-logic`** — a controller method is exactly one `return` of a single delegation. No branching, no transformation.
- **`architecture/no-restricted-layer-imports`** — path-based one-way boundaries: controllers cannot import adapters/infrastructure; DTOs cannot import services; services cannot import controllers; repositories cannot import services/controllers.
- **`architecture/no-inline-domain-definitions`** — no inline types/interfaces/enums/constants/schemas in layer files; extract to `model/`, `dto/`, `lib/`, or `packages/shared`.
- **`architecture/no-direct-sdk-imports`** — vendor SDKs (e.g. `@google/genai`) importable only inside their owning `adapters/` directory.
- **`architecture/no-direct-env-access`** — `process.env` only in `src/config` and `src/bootstrap`.
- **`architecture/no-raw-library-imports`** — business code imports the app-owned wrapper, never the raw library (fetch/storage/logging included).
- **`architecture/repository-persistence-only`** — repositories do resource access only; no business policy.
- **`architecture/application-layer-boundaries`** — use-case/service one-way rule; no pass-through tiers.
- **`architecture/tsx-pure-composition`** — TSX files are pure composition; state/effects/handlers live in hooks (frontend).
- **`architecture/no-restricted-vendor-imports`** with `eslint/package-boundaries.config.mjs` — each vendor package is importable only inside its owning folder, so swapping any vendor touches exactly one place.

Boundary policy lives in the config files (`architecture.config.mjs`, `package-boundaries.config.mjs`) — never hardcoded in rule implementations. The plugin has its own vitest project (`lint-rules`).

---

## 7. Request lifecycle (end to end)

```
HTTP request (Fastify: helmet/CORS, bounded body, trustProxy, UUID genReqId, pino request log)
  → Throttler guard      per-route limits (analyze: 10/min)          (core/rate-limit)
  → Upload interceptor   multipart image + consent field             (core/http)
  → Zod pipe             strict schema parse, issues flattened+logged (core/validation)
  → Controller           one delegation                              (api/*.controller.ts)
  → Use case / Service   analyze-game orchestration:
                         consent → file-security chain → trait
                         extraction (only image-facing step) →
                         buffer wipe in finally → candidate gen →
                         judge → aggregation + fallback              (application/*)
  → Adapters             Gemini (text/image), ClamAV (fail-closed)   (adapters/*)
  ← Exception filter     on throw: AppError → sanitized envelope
                         { statusCode, errorCode, message, messageKey } (core/errors)
```

---

## 8. Frontend operating system (summary only)

`apps/web` (Next.js App Router) follows the same philosophy with its own layer chain: **Component → Hook → Service → Gateway** ([rules/02](../rules/02-frontend-components-tsx.md), [rules/03](../rules/03-frontend-hooks.md), [rules/04](../rules/04-frontend-services-gateways.md)). TSX is pure composition — state, effects, and handlers live in hooks; logic lives in `lib`/services; all HTTP goes through wrapped gateways using `@twinzy/shared` schemas; no raw `fetch`/storage/SDK imports in business code. Deep web internals are documented in the frontend rules and `docs/frontend-architecture.md`, not here.

---

See [`reference-patterns.md`](./reference-patterns.md) for copy-ready code per layer, [`codebase-navigation.md`](./codebase-navigation.md) for the task router and the current→target migration map, and [`stack-and-toolchain.md`](./stack-and-toolchain.md) for the toolchain.
