# Glossary — The Workspace Vocabulary

> The shared dictionary for the Twinzy monorepo. One crisp line per term, cross-linked to the rule, skill, or map that governs it. This file implements the canon in [architecture-map.md](./architecture-map.md) and [/rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md); when a definition and the canon disagree, the canon wins.

Use it to settle "what do we mean by X here?" Terms are grouped, not alphabetized. Skim **Layers** first, then **Twinzy domain**.

---

## Layers (the architecture spine)

| Term | One-line definition | Governed by |
| --- | --- | --- |
| **Controller** | The HTTP transport entry point (`api/<feature>.controller.ts`): applies throttle/interceptors/pipes and delegates with exactly **one** call per method — no logic. | [/rules/18-routes-controllers.md](../rules/18-routes-controllers.md) |
| **Application layer** | Where orchestration lives — services plus use cases that coordinate modules, repositories, and adapters. | [/rules/19-services-application-layer.md](../rules/19-services-application-layer.md) |
| **Service** | A focused capability (`application/<capability>.service.ts`): one job, methods ≤ ~20 lines, the **default** unit of work. | [/rules/19-services-application-layer.md](../rules/19-services-application-layer.md) |
| **Use case** | The escalation from a service (`application/<action>.use-case.ts`): one operation orchestrating multiple modules in mandatory order while owning a resource lifecycle — e.g. `analyze-game.use-case.ts` and its buffer wipe. Use cases call services; services never call use cases. | [/rules/17-manager-layer.md](../rules/17-manager-layer.md) |
| **Use case vs. service** | The escalation rule: default to a service; escalate only when a single operation must sequence several modules **and** guarantee cleanup/fallback — never for simple pass-through (banned). | [architecture-map.md §3](./architecture-map.md) |
| **Repository** | A bounded, read-only resource store (`infrastructure/<resource>.repository.ts`) — here the prompt template store; there is **no database by design** and nothing user-derived is ever persisted. | [/rules/20-repositories-database.md](../rules/20-repositories-database.md) |
| **Adapter** | A typed, app-owned wrapper around one external SDK/daemon (`adapters/<vendor>.adapter.ts` — Gemini, ClamAV) so business code depends on our interface, never the vendor. | [/rules/10-library-modularization.md](../rules/10-library-modularization.md) |
| **Port** | The interface an adapter implements plus its `Symbol` injection token, both in `model/` — e.g. the AI provider port whose two methods split image-capable from text-only generation. | [/rules/10-library-modularization.md](../rules/10-library-modularization.md) |
| **One-way dependency rule** | Dependencies point inward and downward only: Controller → Application → Infrastructure/Adapters → model/lib. A layer never imports the layers above it (ESLint-enforced). | [/rules/01-architecture.md](../rules/01-architecture.md) |
| **Pass-through tier** | A class that only forwards a call to another class — banned; dissolve it and delegate directly (the fate of the old health manager). | [architecture-map.md §3](./architecture-map.md) |

---

## Module structure & contracts

| Term | One-line definition | Governed by |
| --- | --- | --- |
| **Module** | One bounded feature under `apps/api/src/modules/<feature>/`, wired by `<feature>.module.ts`, mirroring the layers internally. | [/rules/16-backend-architecture.md](../rules/16-backend-architecture.md) |
| **Module public surface** | The `index.ts` barrel declaring what other modules may import; cross-module access never reaches into internals. | [/rules/01-architecture.md](../rules/01-architecture.md) |
| **`model/`** | The home for a feature's extracted declarations — types, as-const enums, constants, ports — so no inline shapes live in layer files. | [/rules/05-types-enums-constants.md](../rules/05-types-enums-constants.md) |
| **`lib/`** | A feature's pure helpers — sanitizers, guards, mappers, parsers — that keep services and use cases orchestration-thin. | [/rules/19-services-application-layer.md](../rules/19-services-application-layer.md) |
| **`core/`** | Cross-cutting backend infrastructure importable everywhere: logger, errors + filter, zod validation pipe, rate limit, openapi, http/multipart. | [architecture-map.md](./architecture-map.md) |
| **`@twinzy/shared`** | The `packages/shared` workspace of zod schemas, constants, as-const enums, and types both apps consume as **built dist** (no TS path alias; `build:shared` runs first). | [/rules/05-types-enums-constants.md](../rules/05-types-enums-constants.md) |
| **As-const enum** | The only enum shape allowed: an `as const` object + a `*_VALUES` array + a derived union type — the TypeScript `enum` keyword is banned. | [/rules/05-types-enums-constants.md](../rules/05-types-enums-constants.md) |
| **Zero inline domain definitions** | No types/interfaces/enums/constants/DTOs/schemas declared inside controllers, services, use cases, adapters, or repositories — extract to `model/`, `dto/`, `lib/`, or `packages/shared`. | [/rules/05-types-enums-constants.md](../rules/05-types-enums-constants.md) |
| **Zod DTO** | A strict zod schema in `api/dto/` (unknown keys rejected = whitelist behavior) plus its inferred type — zod everywhere, class-validator never. | [/rules/21-dto-validation.md](../rules/21-dto-validation.md) |
| **Vendor swap surface** | The single folder a vendor may be imported in (ESLint-enforced), so replacing Gemini, ClamAV, pino, or fetch touches exactly one place. | [/rules/10-library-modularization.md](../rules/10-library-modularization.md) |
| **Bounded list** | Any produced list has a hard cap (workspace max 100; the game caps at 5 candidates / 4 displayed results) — no unbounded accumulation. | [/rules/07-performance-scalability.md](../rules/07-performance-scalability.md) |

---

## Errors, config, observability

| Term | One-line definition | Governed by |
| --- | --- | --- |
| **`AppError`** | The typed base for every user-facing failure; subclasses map scenarios to statuses — Validation 400, Unauthorized 401, Forbidden 403, NotFound 404, Conflict 409, PayloadTooLarge 413, Integration 502. | [/rules/16-backend-architecture.md](../rules/16-backend-architecture.md) |
| **messageKey** | A stable, localizable error identifier of the form `errors.<feature>.<key>` carried by an `AppError` and resolved by the frontend i18n dictionary — never a hardcoded user string. | [/rules/12-i18n.md](../rules/12-i18n.md) |
| **ErrorCode envelope** | The sanitized error response every failure returns — `ApiErrorResponse` (`statusCode`, stable legacy `ErrorCode` string, safe `message`) with `messageKey` added additively; never provider errors, stacks, or file contents. | [/rules/22-observability-logging.md](../rules/22-observability-logging.md) |
| **Typed config** | Zod-validated configuration (`config/env.schema.ts` + `@nestjs/config`) that fails the boot fast; `process.env` is legal only in `src/config` and `src/bootstrap`. | [/rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md) |
| **`AppLogger`** | The `core/logger` port over nestjs-pino — the only sanctioned logging path; `console.*` is banned and redaction is mandatory. | [/rules/22-observability-logging.md](../rules/22-observability-logging.md) |
| **Log redaction** | Stripping secrets, PII, image bytes, and prompt contents from log payloads before emit — pino redaction paths plus the privacy module's redaction service. | [/rules/22-observability-logging.md](../rules/22-observability-logging.md) |
| **Quality gate** | The required-green command set — `lint`, `typecheck`, `test:unit`, `test:coverage`, `build` (all via `npm run validate`) — backed by Husky hooks; never bypassed with `--no-verify`. | [/rules/24-release-gate.md](../rules/24-release-gate.md) |
| **Gated coverage scope** | The explicit `include`/`exclude` file set the coverage thresholds apply to (app composition roots and test scaffolding excluded), so the 95/90/95/95 floor measures code that carries logic. | [/rules/09-testing-coverage.md](../rules/09-testing-coverage.md) |

---

## Twinzy domain

| Term | One-line definition | Governed by |
| --- | --- | --- |
| **Trait** | One of the **exactly 15** visible, non-identifying appearance keys (`TRAIT_KEYS` in `@twinzy/shared` — face shape, hair color, jawline, ...) written as text; the only thing ever derived from the photo. | [/rules/14-ai-safety.md](../rules/14-ai-safety.md) |
| **Trait extraction** | Pipeline step 1 and the **only image-facing step**: prompt 1 + the image → a zod-validated JSON of the 15 traits. | [ai-context.md](./ai-context.md) |
| **Candidate** | A playful public style/vibe match generated in step 2 from the **written traits only** (1–5 per run, text-only prompt). | [ai-context.md](./ai-context.md) |
| **Judge** | Pipeline step 3: a text-only pass that scores each candidate against the traits and returns judged results (max 4 displayed). | [ai-context.md](./ai-context.md) |
| **Verdict** | The judged strength of a match — `strong` / `medium` / `weak` (as-const `Verdict` in `@twinzy/shared`) alongside a 0–100 score. | [/rules/05-types-enums-constants.md](../rules/05-types-enums-constants.md) |
| **Public category** | The kind of public figure a candidate is — actor, singer, creator, athlete, public figure, other (as-const `PublicCategory` in `@twinzy/shared`). | [/rules/05-types-enums-constants.md](../rules/05-types-enums-constants.md) |
| **Consent flag** | The explicit multipart `consent` field that must accompany every upload; anything other than affirmative consent fails the request before any processing. | [/rules/15-file-upload-security.md](../rules/15-file-upload-security.md) |
| **Forbidden wording** | Identity-implying phrases ("looks like", "is", "twin of", ...) that must never appear in output; the forbidden-wording guard rejects responses containing them. | [/rules/14-ai-safety.md](../rules/14-ai-safety.md) |
| **Safety filter** | The post-validation pass (ai-safety service + sanitizer + forbidden-wording guard) that drops or rewrites unsafe AI output before it can reach a user. | [/rules/14-ai-safety.md](../rules/14-ai-safety.md) |
| **Disclaimer** | The mandatory "entertainment only — style/vibe fit, not identity" text the aggregation step enforces on every result, including fallbacks. | [/rules/14-ai-safety.md](../rules/14-ai-safety.md) |
| **Fail-closed ClamAV** | The virus-scan stance: when scanning is enabled and the scanner is unreachable or errors, the upload is **rejected** — never waved through. | [/rules/15-file-upload-security.md](../rules/15-file-upload-security.md) |
| **Buffer wipe** | Zero-filling the uploaded image buffer in a `finally` block of the analyze use case, on success **and** failure — the image lives exactly as long as trait extraction needs it. | [/rules/15-file-upload-security.md](../rules/15-file-upload-security.md) |
| **Fallback result** | The safe, disclaimer-carrying result returned when no candidate survives the safety filters — the pipeline's terminal state is never an unsafe answer. | [/rules/08-reliability-durability.md](../rules/08-reliability-durability.md) |
| **Text-only boundary** | The AI provider port's type-level guarantee: only `generateFromImage` can carry an image and only trait extraction may call it; candidate and judge steps are text-only by construction. | [/rules/14-ai-safety.md](../rules/14-ai-safety.md) |

---

## Related

[architecture-map.md](./architecture-map.md) · [codebase-navigation.md](./codebase-navigation.md) · [reference-patterns.md](./reference-patterns.md) · [ai-context.md](./ai-context.md) · [/rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md) · [/memory/known-pitfalls.md](../memory/known-pitfalls.md)
