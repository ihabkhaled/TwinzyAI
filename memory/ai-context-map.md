# AI Context Map

> The fixed orientation sequence for any agent working in this repo. Read order is not optional;
> depth scales with the change, the sequence does not. Skimming one file and guessing is the
> failure mode this map exists to prevent: the architecture is enforced mechanically (strict TS,
> the custom `architecture/*` ESLint plugin, husky gates), so code written against the wrong
> mental model is rejected at the gate.

## The orientation sequence (read in this order)

| Step | Read | Why |
| --- | --- | --- |
| 1 | [/CLAUDE.md](../CLAUDE.md) (mirror of [/AGENTS.md](../AGENTS.md)) | Entry point, non-negotiables in short form, authority order (rules win). |
| 2 | [/context/architecture-map.md](../context/architecture-map.md) | Single source of truth for layers, module anatomy, and boundaries. |
| 3 | [/rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md) | The hard rules. If a request conflicts, the rule wins. |
| 4 | The **layer rule + skill** for your task (tables below) | The narrow standard for the layer you are about to touch. |
| 5 | [known-pitfalls.md](./known-pitfalls.md) | Recurring mistakes — **read before writing any code**. |

Then pull real paths from [/context/codebase-navigation.md](../context/codebase-navigation.md)
and copy-ready shapes from [/context/reference-patterns.md](../context/reference-patterns.md).
[/context/task-router.md](../context/task-router.md) is the extended routing table.

## Route by task → rule + skill

| You are about to… | Rule | Skill |
| --- | --- | --- |
| Scaffold a backend feature module | [16-backend-architecture.md](../rules/16-backend-architecture.md) | [create-module.md](../skills/create-module.md) |
| Add/edit a controller | [18-routes-controllers.md](../rules/18-routes-controllers.md) | [create-controller.md](../skills/create-controller.md) |
| Add orchestration (manager/use case) | [17-manager-layer.md](../rules/17-manager-layer.md) | [create-manager-use-case.md](../skills/create-manager-use-case.md) |
| Add a focused service | [19-services-application-layer.md](../rules/19-services-application-layer.md) | [create-service-layer.md](../skills/create-service-layer.md) |
| Add/validate a DTO (zod) | [21-dto-validation.md](../rules/21-dto-validation.md) | [create-dto-validation.md](../skills/create-dto-validation.md) |
| Add a type/constant (no `enum`) | [05-types-enums-constants.md](../rules/05-types-enums-constants.md) | [decompose-large-file.md](../skills/decompose-large-file.md) |
| Wrap an external library | [10-library-modularization.md](../rules/10-library-modularization.md) | [add-library.md](../skills/add-library.md) |
| Touch AI prompts/providers | [14-ai-safety.md](../rules/14-ai-safety.md) | [add-ai-provider.md](../skills/add-ai-provider.md) |
| Touch file upload / scanning | [15-file-upload-security.md](../rules/15-file-upload-security.md) | [secure-file-upload.md](../skills/secure-file-upload.md) |
| Touch logging | [22-observability-logging.md](../rules/22-observability-logging.md) | — ([observability-decisions.md](./observability-decisions.md)) |
| Write tests | [09-testing-coverage.md](../rules/09-testing-coverage.md) | [write-unit-tests.md](../skills/write-unit-tests.md) / [write-integration-tests.md](../skills/write-integration-tests.md) / [write-e2e-tests.md](../skills/write-e2e-tests.md) |
| Fix lint/typecheck failures | [11-eslint-typescript.md](../rules/11-eslint-typescript.md) | [fix-eslint-typecheck.md](../skills/fix-eslint-typecheck.md) |
| Ship / declare done | [24-release-gate.md](../rules/24-release-gate.md) | [final-validation.md](../skills/final-validation.md) |

Frontend work (apps/web) is owned by a parallel workstream — rules
[02](../rules/02-frontend-components-tsx.md)/[03](../rules/03-frontend-hooks.md)/[04](../rules/04-frontend-services-gateways.md)
apply there; do not touch apps/web from backend tasks.

## Memory you may need (deeper context, not warm-up)

| Question | Memory note |
| --- | --- |
| What stack/toolchain did we lock? | [backend-stack.md](./backend-stack.md) |
| Why is the architecture shaped this way? | [project-architecture.md](./project-architecture.md) · [architecture-decisions.md](./architecture-decisions.md) |
| Is there a database? (No — by design.) | [database-decisions.md](./database-decisions.md) |
| Are there events/queues? (No — by design.) | [event-notification-decisions.md](./event-notification-decisions.md) |
| How do we log/trace? | [observability-decisions.md](./observability-decisions.md) |
| Security posture? | [security-decisions.md](./security-decisions.md) |
| Privacy invariants? | [privacy-decisions.md](./privacy-decisions.md) · [ai-safety-decisions.md](./ai-safety-decisions.md) |
| Which libraries are wrapped, where? | [library-boundaries.md](./library-boundaries.md) |
| How do we test? | [testing-strategy.md](./testing-strategy.md) |
| What blocks a release? | [release-checklist.md](./release-checklist.md) |

## Project records

- Product: **Twinzy** — free, privacy-safe, mobile-first AI style/vibe game (entertainment only).
- Entry tool files: `CLAUDE.md` / `AGENTS.md` / `CODEX.md` (all mirrors; AGENTS.md canonical).
- Canonical feature folder for the engineering-OS adoption:
  [/docs/features/engineering-os-migration/](../docs/features/engineering-os-migration/00-intake.md).
- ADRs: [adr-001-strict-engineering-os.md](../architecture/adrs/adr-001-strict-engineering-os.md) ·
  [adr-002-zod-validation-vendor.md](../architecture/adrs/adr-002-zod-validation-vendor.md).

## Maintenance

- New rule or skill ⇒ add its row here in the same change.
- New recurring mistake ⇒ record it in [known-pitfalls.md](./known-pitfalls.md).
- Dead links defeat the map — keep every link pointing at a file that exists in this repo.
