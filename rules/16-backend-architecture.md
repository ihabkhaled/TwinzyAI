# 16 — Backend Architecture

> The canonical anatomy of `apps/api`. This file applies [`/context/architecture-map.md`](../context/architecture-map.md) to Twinzy and implements rules 16–23 of [00-non-negotiable-rules.md](./00-non-negotiable-rules.md). If anything here contradicts the map or the non-negotiables, those win.

---

## Canonical source tree (`apps/api/src`)

```
src/
├── main.ts                      # entrypoint → bootstrap()
├── app.module.ts                # root module: imports config, core, feature modules
├── bootstrap/                   # app assembly — the ONLY home of fastify, @fastify/*,
│                                # @nestjs/platform-*; process.env allowed here
├── config/                      # @nestjs/config + zod env schema (fail-fast);
│                                # AppConfigService — the only injectable config surface
├── core/                        # cross-cutting infrastructure (importable everywhere)
│   ├── logger/                  # AppLogger port over nestjs-pino (redaction, request ids)
│   ├── errors/                  # AppError hierarchy + global exception filter
│   ├── validation/              # ZodValidationPipe + validation error shaping
│   ├── rate-limit/              # @nestjs/throttler wiring, limits from config
│   ├── openapi/                 # @nestjs/swagger, flag-gated
│   └── http/                    # reserved home for a shared outbound HTTP adapter (none today)
└── modules/
    └── <feature>/               # one bounded feature (anatomy below)
```

`packages/shared` is the cross-side shared layer (schemas, enums, constants, types) — the backend's "shared kernel" lives there, not in a `src/shared` copy.

## Module anatomy (the unit you scaffold)

```
src/modules/<feature>/
├── <feature>.module.ts          # wires controllers + providers; declares exports
├── index.ts                     # public surface barrel — the ONLY thing other modules import
├── api/
│   ├── <feature>.controller.ts  # thin transport: one delegation per method
│   └── dto/                     # zod DTO schemas + z.infer types (backed by packages/shared)
├── application/
│   ├── <action>.use-case.ts     # multi-step orchestration + cleanup guarantees
│   └── <feature>.service.ts     # focused capability (≤ ~20 lines/method)
├── domain/                      # pure policies/invariants (when the feature has them)
├── infrastructure/
│   └── <feature>.repository.ts  # persistence only — NONE exist today (rules/20)
├── adapters/
│   └── <vendor>.adapter.ts      # the only file importing that vendor's SDK
├── model/                       # zero-inline homes
│   ├── <feature>.types.ts  <feature>.enums.ts  <feature>.constants.ts
└── lib/
    └── <feature>.mappers.ts  <feature>.helpers.ts  <feature>.formatters.ts
```

Current feature modules: `game` (the analyze pipeline), `ai` (prompts + GeminiAdapter), `file-security` (upload chain + ClamAV), `result-aggregation`, `privacy`, `health`. Omit folders a feature doesn't need — never invent parallel ones.

## What lives where

| Concern | Home | Never in |
| --- | --- | --- |
| Route decorators, request binding | `api/<feature>.controller.ts` | services, use cases |
| DTO schemas (zod) | `api/dto/` ← `packages/shared/src/schemas` | controllers/services inline |
| Multi-step orchestration, buffer-wipe guarantee | `application/*.use-case.ts` | controllers, services |
| Focused capabilities | `application/*.service.ts` | controllers |
| Pure business rules | `domain/` | anywhere with I/O |
| Vendor SDKs | `adapters/*.adapter.ts` | everything else ([10](./10-library-modularization.md)) |
| Types/enums/constants | `model/` or `packages/shared` | layer files ([05](./05-types-enums-constants.md)) |
| Mapping/formatting/helpers | `lib/` | service method bodies |
| AppError classes + filter | `core/errors` | per-module copies |
| Env reads | `config/` + `bootstrap/` only | anywhere else ([25](./25-configuration-and-environment.md)) |
| Fastify/platform wiring | `bootstrap/` | modules, core |

## Layer order and the boundary rule

**Controller → Use case → Service → Adapter (→ Repository, if persistence ever exists).** Dependencies point downward only; adapters are leaves. Cross-module use goes through the target module's `index.ts` public surface — never deep imports (`architecture/no-restricted-layer-imports`). Export deliberately: the module class, public use cases/services, public types; keep DTO schemas, adapters, and internals unexported.

## Request lifecycle (end to end)

```
HTTP request
  → Throttler        rate limit from config                        (core/rate-limit)
  → Pipe             ZodValidationPipe parses + strict-rejects      (core/validation)
  → Controller       one delegation → application method            (api/*.controller.ts)
  → Use case         consent → file chain → traits → wipe → …       (application/*)
  → Services/Adapters focused capabilities / vendor calls           (application/*, adapters/*)
  ← Exception filter on throw: AppError → sanitized envelope        (core/errors)
  ← Response         typed result from shared schemas
```

## How to add a module

1. Scaffold the anatomy above with `<feature>.module.ts` + `index.ts` ([/skills/create-module.md](../skills/create-module.md)).
2. Enums as as-const + `*_VALUES` in `packages/shared` or `model/` ([05](./05-types-enums-constants.md)).
3. Zod DTOs in `api/dto/`, shared-backed ([21](./21-dto-validation.md)).
4. Service for focused capabilities; use case only for multi-step orchestration ([17](./17-manager-layer.md), [19](./19-services-application-layer.md)).
5. Controller last — one delegation per method ([18](./18-routes-controllers.md)).
6. Wrap any new vendor behind an adapter + boundaries entry ([10](./10-library-modularization.md)).
7. A distinct `messageKey` per error scenario ([12](./12-i18n.md), [26](./26-error-handling-and-exceptions.md)).
8. Tests first; gates green ([09](./09-testing-coverage.md)).

---

## Checklist

- [ ] Module matches the canonical anatomy; no invented folders
- [ ] Cross-module imports only via `index.ts`; public surface deliberate
- [ ] Layer order downward only; adapters are leaves; controllers never see SDKs/repositories
- [ ] Zero inline declarations — `model/`, `api/dto/`, `lib/` own them
- [ ] Env reads confined to `config/`/`bootstrap/`; platform packages confined to `bootstrap/`
- [ ] Gates green before "done"
