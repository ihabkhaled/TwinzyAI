# rules/ — Full Rule Bodies

> These files are the single source of truth for engineering rules. **They win every conflict** with AGENTS.md, CLAUDE.md, CODEX.md, .cursorrules, or docs. Read [00](./00-non-negotiable-rules.md) first, then the file for the layer you're touching, then follow the matching [skill](../skills/README.md).

**Precedence:** the governance lifecycle in [`/CLAUDE.md`](../CLAUDE.md)/[`/AGENTS.md`](../AGENTS.md) defines *which phases and artifacts* a change passes through; [`/context/architecture-map.md`](../context/architecture-map.md) + [`00-non-negotiable-rules.md`](./00-non-negotiable-rules.md) are the engineering canon these numbered files apply; the numbered rules carry the layer detail. Where two rules could both apply, **the stricter one wins**.

## Backend

| # | File | One line |
| --- | --- | --- |
| 00 | [00-non-negotiable-rules.md](./00-non-negotiable-rules.md) | The 50 hard rules, sectioned, with enforcement + pre-flight checklist |
| 01 | [01-architecture.md](./01-architecture.md) | Monorepo layout, one-way layering, module boundary rule |
| 05 | [05-types-enums-constants.md](./05-types-enums-constants.md) | Zero-inline policy; as-const enums + `*_VALUES`; search-then-extend |
| 06 | [06-security.md](./06-security.md) | HTTP edge hardening, rate limiting, secrets, no-auth-today standing rule |
| 07 | [07-performance-scalability.md](./07-performance-scalability.md) | Timeouts, bounded lists (cap 100), concurrency placement, stateless scale |
| 08 | [08-reliability-durability.md](./08-reliability-durability.md) | AbortController timeouts, wipe-in-finally, fail-safe side effects, shutdown |
| 09 | [09-testing-coverage.md](./09-testing-coverage.md) | Tests-first, Vitest projects, `*.test.ts` naming, 95/90/95/95 floor |
| 10 | [10-library-modularization.md](./10-library-modularization.md) | The vendor ownership table — one owner per package, ESLint-enforced |
| 11 | [11-eslint-typescript.md](./11-eslint-typescript.md) | The real strict flags, the architecture plugin, 0/0 gate, tsgo for api |
| 16 | [16-backend-architecture.md](./16-backend-architecture.md) | Canonical module anatomy; core/config/bootstrap homes; request lifecycle |
| 17 | [17-manager-layer.md](./17-manager-layer.md) | Application layer: use cases (managers retired); the analyze-game example |
| 18 | [18-routes-controllers.md](./18-routes-controllers.md) | One delegation per handler; decorators yes, logic no |
| 19 | [19-services-application-layer.md](./19-services-application-layer.md) | Focused services ≤ ~20 lines/method; extract to lib//domain/ |
| 20 | [20-repositories-database.md](./20-repositories-database.md) | No DB today by decision; the binding rules if persistence ever lands |
| 21 | [21-dto-validation.md](./21-dto-validation.md) | Zod-only boundary validation; `.strict()` schemas; class-validator forbidden |
| 22 | [22-observability-logging.md](./22-observability-logging.md) | AppLogger port, pino redaction, request-id correlation, 4xx/5xx levels |
| 25 | [25-configuration-and-environment.md](./25-configuration-and-environment.md) | Zod env fail-fast; AppConfigService the only surface; .env.example discipline |
| 26 | [26-error-handling-and-exceptions.md](./26-error-handling-and-exceptions.md) | AppError hierarchy (incl. 413), messageKeys, one filter, compatible envelope |
| 27 | [27-async-events-and-jobs.md](./27-async-events-and-jobs.md) | No brokers/jobs today; terminal AI-call outcomes; the rules if events arrive |

## Frontend

| # | File | One line |
| --- | --- | --- |
| 02 | [02-frontend-components-tsx.md](./02-frontend-components-tsx.md) | TSX is pure composition; props from hooks; UI primitives reused |
| 03 | [03-frontend-hooks.md](./03-frontend-hooks.md) | Hooks own state/effects/handlers; thin; call services only |
| 04 | [04-frontend-services-gateways.md](./04-frontend-services-gateways.md) | Services map/sequence; gateways HTTP-only via lib/http + zod |
| 12 | [12-i18n.md](./12-i18n.md) | Typed dictionary; backend messageKeys mapped to localized copy |
| 13 | [13-accessibility.md](./13-accessibility.md) | jsx-a11y as errors; touch targets; reduced motion; AA contrast |

## Product & gates

| # | File | One line |
| --- | --- | --- |
| 14 | [14-ai-safety.md](./14-ai-safety.md) | Prompt isolation, no biometrics/sensitive inference, validated + filtered outputs |
| 15 | [15-file-upload-security.md](./15-file-upload-security.md) | The ordered fail-closed upload chain; memory-only, wiped, never logged |
| 23 | [23-review-checklist.md](./23-review-checklist.md) | The consolidated pre-merge gate with MUST/SHOULD blockers |
| 24 | [24-release-gate.md](./24-release-gate.md) | Full release sequence: gates, trivy, docker smoke, runbook, release notes |
