# Codebase Navigation — Task Router & "Where Does X Live"

> Your fastest path from a task to the right layer, files, rule, and skill. This implements the canon in [architecture-map.md](./architecture-map.md), [stack-and-toolchain.md](./stack-and-toolchain.md), and [rules/00](../rules/00-non-negotiable-rules.md). When in doubt, those win.

Use this file as a lookup, not a tutorial. Pick the row that matches your task, open the listed files, read the rule, then follow the skill step by step.

---

## 1. The golden path (every change)

1. **Locate** the module and layer with §3 — never edit code you have not read.
2. **Read the rule(s)** for your row in §2; they define the boundaries you must respect.
3. **Follow the skill** end to end — it scaffolds the right files in the right layer.
4. **Write/adjust tests first** ([rules/09](../rules/09-testing-coverage.md)), then implement.
5. **Run the gates** (§5) until all green. Never bypass hooks.

> One module is the unit of work: `apps/api/src/modules/<feature>/` (backend) or `apps/web/src/features/<feature>/` (frontend). Stay inside it; consume other modules only through their `index.ts` public surface.

---

## 2. Task router

### Build features

| Task | Layer & files to open | Rule(s) | Skill |
| --- | --- | --- | --- |
| Scaffold a new backend module | the whole module tree + `app.module.ts` | [16](../rules/16-backend-architecture.md), [01](../rules/01-architecture.md) | [create-module.md](../skills/create-module.md) |
| Add an HTTP endpoint | `api/<feature>.controller.ts` + the application method it delegates to | [18](../rules/18-routes-controllers.md) | [create-controller.md](../skills/create-controller.md) |
| Add a focused capability | `application/<capability>.service.ts` (≤20 lines/method) | [19](../rules/19-services-application-layer.md) | [create-service-layer.md](../skills/create-service-layer.md), [create-service.md](../skills/create-service.md) |
| Add multi-step orchestration | `application/<action>.use-case.ts` (ordered cross-module steps + resource lifecycle, e.g. buffer wipe) | [17](../rules/17-manager-layer.md), [19](../rules/19-services-application-layer.md) | [create-manager-use-case.md](../skills/create-manager-use-case.md) |
| Add a frontend feature / screen | `apps/web/src/features/<feature>/` (ui → hooks → services → gateways) | [02](../rules/02-frontend-components-tsx.md), [03](../rules/03-frontend-hooks.md), [04](../rules/04-frontend-services-gateways.md) | [create-feature.md](../skills/create-feature.md), [create-component.md](../skills/create-component.md), [create-hook.md](../skills/create-hook.md) |
| Add a frontend API call | feature `services/` + `gateways/` + `apps/web/src/lib/http` | [04](../rules/04-frontend-services-gateways.md) | [add-api-service-method.md](../skills/add-api-service-method.md) |

### Data & contracts

| Task | Layer & files to open | Rule(s) | Skill |
| --- | --- | --- | --- |
| Add request validation | `api/dto/<action>.dto.ts` — strict zod schema (unknown keys rejected), backed by `@twinzy/shared` | [21](../rules/21-dto-validation.md) | [create-dto-validation.md](../skills/create-dto-validation.md) |
| Add/change a shared schema or contract | `packages/shared/src/schemas|constants|enums|types` (then `npm run build:shared`) | [05](../rules/05-types-enums-constants.md), [21](../rules/21-dto-validation.md) | [create-dto-validation.md](../skills/create-dto-validation.md) |
| Add a type / enum / constant | module `model/` (as-const + `*_VALUES`; never TS `enum`), or `packages/shared` if cross-app | [05](../rules/05-types-enums-constants.md) | [decompose-large-file.md](../skills/decompose-large-file.md) |
| Add/read a bounded resource store | `infrastructure/<resource>.repository.ts` (read-only, bounded; the prompt template store is the model) | [20](../rules/20-repositories-database.md) | [create-repository.md](../skills/create-repository.md) |
| Change an AI prompt | `modules/ai/prompts/*.md` + prompt version in `model/`; loaded via `infrastructure/prompt-template.repository.ts` | [14](../rules/14-ai-safety.md) | [add-ai-provider.md](../skills/add-ai-provider.md) |

### Security & access (upload + AI safety)

| Task | Layer & files to open | Rule(s) | Skill |
| --- | --- | --- | --- |
| Touch the upload pipeline | `modules/file-security/application/*` (validation chain), `adapters/clamav.adapter.ts` (fail-closed), `core/http` (upload interceptor) | [15](../rules/15-file-upload-security.md), [06](../rules/06-security.md) | [secure-file-upload.md](../skills/secure-file-upload.md) |
| Touch AI calls / prompts / safety filters | `modules/ai/application/*`, `lib/forbidden-wording.guard`, `lib/ai-response-sanitizer`, [context/ai-context.md](./ai-context.md) | [14](../rules/14-ai-safety.md) | [add-ai-provider.md](../skills/add-ai-provider.md) |
| Change rate limits | `core/rate-limit` + per-route `@Throttle` constants in `model/` | [06](../rules/06-security.md), [07](../rules/07-performance-scalability.md) | [create-controller.md](../skills/create-controller.md) |
| Privacy / log redaction | `modules/privacy/application/log-redaction.service.ts` + `core/logger` redaction | [22](../rules/22-observability-logging.md), [06](../rules/06-security.md) | [security-review.md](../skills/security-review.md) |
| Review a security-sensitive change | the touched module + threat model in [docs/security-threat-model.md](../docs/security-threat-model.md) | [06](../rules/06-security.md) | [security-review.md](../skills/security-review.md) |

### Integrations & platform

| Task | Layer & files to open | Rule(s) | Skill |
| --- | --- | --- | --- |
| Add / wrap an external library | an `adapters/<vendor>.adapter.ts` or a wrapper in `lib/` (frontend: `apps/web/src/lib/`) | [10](../rules/10-library-modularization.md) | [add-library.md](../skills/add-library.md) |
| Swap / add an AI provider | new adapter implementing the AI provider port in `modules/ai/model/` (Symbol token binding) | [14](../rules/14-ai-safety.md), [10](../rules/10-library-modularization.md) | [add-ai-provider.md](../skills/add-ai-provider.md) |
| Add a config value / env var | `src/config/env.schema.ts` (zod) + `app-config.service.ts` typed getter + [docs/env-vars.md](../docs/env-vars.md) | [00](../rules/00-non-negotiable-rules.md), [16](../rules/16-backend-architecture.md) | [create-module.md](../skills/create-module.md) |
| Touch app assembly / Fastify platform | `src/bootstrap/` (`create-app`, `fastify-adapter`, `configure-*`) | [16](../rules/16-backend-architecture.md) | [final-validation.md](../skills/final-validation.md) |
| Modularize an existing raw import | find raw imports → wrap → repoint consumers | [10](../rules/10-library-modularization.md) | [modularize-existing-library.md](../skills/modularize-existing-library.md) |

### Errors & observability

| Task | Layer & files to open | Rule(s) | Skill |
| --- | --- | --- | --- |
| Add a typed error | `core/errors/` — `AppError` subclass + `messageKey = errors.<feature>.<key>` + `ErrorCode` entry | [16](../rules/16-backend-architecture.md) | [create-service-layer.md](../skills/create-service-layer.md) |
| Change the error envelope / filter | `core/errors/app-exception.filter.ts` (envelope stays `ApiErrorResponse`-compatible) | [16](../rules/16-backend-architecture.md), [22](../rules/22-observability-logging.md) | [security-review.md](../skills/security-review.md) |
| Add a user-facing message | `messageKey` on the error + frontend i18n dictionary (`apps/web/src/i18n`) | [12](../rules/12-i18n.md) | [create-feature.md](../skills/create-feature.md) |
| Add logs | `core/logger` `AppLogger` port only — never `console.*`; redact first | [22](../rules/22-observability-logging.md) | [reliability-review.md](../skills/reliability-review.md) |

### Quality & review

| Task | Layer & files to open | Rule(s) | Skill |
| --- | --- | --- | --- |
| Fix a bug | reproduce → find the owning layer → failing test → fix | [08](../rules/08-reliability-durability.md), [09](../rules/09-testing-coverage.md) | [write-unit-tests.md](../skills/write-unit-tests.md) |
| Decompose a god-file | the offending file → extract to `lib/`, `model/`, `application/` | [01](../rules/01-architecture.md), [11](../rules/11-eslint-typescript.md) | [decompose-large-file.md](../skills/decompose-large-file.md) |
| Resolve ESLint / typecheck failures | the flagged file (never disable rules) | [11](../rules/11-eslint-typescript.md) | [fix-eslint-typecheck.md](../skills/fix-eslint-typecheck.md) |
| Improve performance | pipeline steps (timeouts, caps), adapters (retry budgets) | [07](../rules/07-performance-scalability.md) | [performance-review.md](../skills/performance-review.md) |
| Harden reliability | use-case (fallbacks, terminal states), adapters (timeout, fail-closed) | [08](../rules/08-reliability-durability.md) | [reliability-review.md](../skills/reliability-review.md) |
| Write tests | `*.test.ts` in module `tests/` (unit), `apps/api/src/tests/*.integration.test.ts`, `apps/web/e2e` | [09](../rules/09-testing-coverage.md) | [write-unit-tests.md](../skills/write-unit-tests.md), [write-integration-tests.md](../skills/write-integration-tests.md), [write-e2e-tests.md](../skills/write-e2e-tests.md) |
| Accessibility pass | `apps/web` components | [13](../rules/13-accessibility.md) | [accessibility-review.md](../skills/accessibility-review.md) |
| Final pre-PR / release validation | all gates + checklist | [23](../rules/23-review-checklist.md), [24](../rules/24-release-gate.md) | [final-validation.md](../skills/final-validation.md) |

---

## 3. Where does X live

### Inside a backend feature module (`apps/api/src/modules/<feature>/`)

| Looking for... | Location |
| --- | --- |
| HTTP endpoints | `api/<feature>.controller.ts` |
| Request/response DTO schemas (zod) | `api/dto/<action>.dto.ts` |
| Focused capability logic | `application/<capability>.service.ts` |
| Multi-step orchestration | `application/<action>.use-case.ts` |
| Bounded read-only resource access | `infrastructure/<resource>.repository.ts` |
| Vendor SDK wrapper | `adapters/<vendor>.adapter.ts` |
| Module types / enums / constants / ports | `model/` |
| Pure helpers (sanitizers, guards, mappers) | `lib/` |
| Prompt templates (ai module) | `prompts/*.md` |
| Wiring + provider registration | `<feature>.module.ts` |
| What other modules may import | `index.ts` |
| Unit tests | `tests/*.test.ts` |

### Cross-cutting (`apps/api/src`)

| Looking for... | Location |
| --- | --- |
| Logger port + pino options + redaction | `core/logger/` |
| `AppError` hierarchy + exception filter + error codes | `core/errors/` |
| Zod validation pipe + issue flattening | `core/validation/` |
| Rate limiting (throttler) | `core/rate-limit/` |
| Flag-gated swagger | `core/openapi/` |
| `HttpReplyLike`, multipart types, upload interceptor | `core/http/` |
| Env schema + typed config service | `config/` (`env.schema.ts`, `app-config.service.ts`) |
| Fastify assembly, security, validation, lifecycle | `bootstrap/` |
| Entrypoint / root module | `main.ts`, `app.module.ts` |
| Integration tests | `tests/*.integration.test.ts` + `tests/fixtures/` |

### Outside the API

| Looking for... | Location |
| --- | --- |
| Shared zod schemas / constants / enums / types | `packages/shared/src` (consumed as built dist `@twinzy/shared`) |
| Frontend feature code | `apps/web/src/features/<feature>/` (Component → Hook → Service → Gateway) |
| Frontend wrapped libraries | `apps/web/src/lib/` |
| ESLint architecture plugin + flat configs | `eslint/` |
| Rules / skills / memory / docs | `rules/`, `skills/`, `memory/`, `docs/` |

---

## 4. Migration map (current → target)

The backend is migrating from the controllers/managers/services/utils layout to the canonical layout in [architecture-map.md](./architecture-map.md) §2. Routes stay stable throughout: `GET /api/v1/health`; `POST /api/v1/game/analyze` (multipart: image file + consent field; throttled 10/min).

| Module | Current | Target |
| --- | --- | --- |
| health | `controllers/health.controller.ts` | `api/health.controller.ts` |
| health | `managers/health.manager.ts` | **REMOVED** — pass-through tier dissolved; controller delegates to `application/health.service.ts` |
| health | `services/health.service.ts` | `application/health.service.ts` |
| health | `constants/` | `model/health.constants.ts` |
| privacy | `services/log-redaction.service.ts` | `application/log-redaction.service.ts` |
| privacy | `utils/log-redaction.util.ts` | `lib/log-redaction.util.ts` |
| result-aggregation | `services/result-aggregation.service.ts` | `application/result-aggregation.service.ts` (+ `lib/` if filters extracted) |
| file-security | `services/{file-security,file-validation,magic-byte-validation,image-decode-validation,virus-scan,temporary-file-cleanup}.service.ts` | `application/` |
| file-security | `adapters/clamav.adapter.ts` | stays `adapters/` |
| file-security | `utils/image-dimensions.util.ts` | `lib/image-dimensions.util.ts` |
| file-security | `constants/` + `types/` | `model/` |
| ai | `adapters/gemini.adapter.ts` | stays `adapters/` (the ONLY file importing `@google/genai`) |
| ai | `services/{trait-extraction,candidate-generation,candidate-judge,ai-safety}.service.ts` | `application/` |
| ai | `prompts/*.md` | stay as module resources |
| ai | `prompts/prompt-loader.service.ts` | `infrastructure/prompt-template.repository.ts` (bounded read-only template store; `fs` access lives here) |
| ai | `prompts/prompt-version.constant.ts` + `constants/` + `enums/` + `types/` | `model/` |
| ai | `interfaces/ai-provider-adapter.interface.ts` | `model/` (port type + injection token) |
| ai | `utils/{forbidden-wording.guard,ai-response-sanitizer,json-response.util}.ts` | `lib/` |
| game | `controllers/game.controller.ts` | `api/game.controller.ts` |
| game | `dto/analyze-request.dto.ts` | `api/dto/analyze-request.dto.ts` |
| game | `managers/game.manager.ts` | `application/analyze-game.use-case.ts` (multi-step orchestrator: consent → file-security chain → trait extraction (only image-facing step) → buffer wipe in `finally` → candidate gen → judge → aggregation + fallback) |
| game | `constants/` | `model/` |
| common (dissolves) | `filters/all-exceptions.filter.ts` | `core/errors/app-exception.filter.ts` |
| common | `exceptions/domain.exception.ts` | legacy compat inside `core/errors` until fully migrated |
| common | `constants/error-codes.constant.ts` | `core/errors/error-code.constants.ts` |
| common | `constants/rate-limit.constant.ts` | config defaults |
| config | `env.schema.ts` (zod) | stays |
| config | `app-config.service.ts` | reimplemented on `@nestjs/config` (same typed getter surface) |
| config | `env.loader.ts` | retired (`ConfigModule` `envFilePath`) |
| config | `app-config.module.ts` | `config.module.ts` |
| infrastructure/logger | `logger.service.ts` etc. | `core/logger/` (`AppLogger` + `AppLoggerPort` + pino options + redaction) |
| NEW | — | `src/bootstrap/{bootstrap,create-app,fastify-adapter,configure-security,configure-validation,configure-swagger,configure-lifecycle,bootstrap.constants}.ts` |
| NEW | — | `src/core/{logger,errors,validation,rate-limit,openapi,http}` |

### Quick decision rules

- **Endpoint behaving wrong?** Never in the controller (thin, one delegation) — look in the use-case/service it calls.
- **Need `process.env`?** Stop. Only legal in `src/config` and `src/bootstrap`; everywhere else inject typed config.
- **Importing a vendor SDK?** Only inside `adapters/`. Business code depends on the port, not the vendor.
- **Class only forwards a call?** That's a banned pass-through tier — dissolve it (see health).
- **Writing an inline `interface`/`type`/`const` in a layer file?** Move it to `model/` or `packages/shared` — ESLint blocks it.
- **Writing a TS `enum`?** Never — as-const object + `*_VALUES` + derived type.

---

## 5. Quality gates (run before "done")

```bash
npm run lint              # 0 errors AND 0 warnings (flat config + architecture plugin)
npm run typecheck         # builds shared, then per-workspace typecheck
npm run test:unit         # api-unit + web-unit + shared-unit + lint-rules projects
npm run test:integration  # api-integration project
npm run test:coverage     # coverage thresholds on the gated scope
npm run build             # shared → api → web
npm run validate          # the whole gate chain in one command
```

Husky enforces a subset automatically: **pre-commit** runs lint-staged + typecheck, **commit-msg** runs commitlint (Conventional Commits), **pre-push** runs test:coverage + build. Never bypass with `--no-verify`. A green build is necessary, not sufficient — prove behavior with tests and walk [rules/23](../rules/23-review-checklist.md).

---

**Related:** [architecture-map.md](./architecture-map.md) · [stack-and-toolchain.md](./stack-and-toolchain.md) · [reference-patterns.md](./reference-patterns.md) · [glossary.md](./glossary.md) · [ai-context.md](./ai-context.md) · [product-context.md](./product-context.md) · [/skills/README.md](../skills/README.md) · [/rules/README.md](../rules/README.md) · [/memory/known-pitfalls.md](../memory/known-pitfalls.md)
