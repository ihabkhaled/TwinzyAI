# skills/ — Task Playbooks

Repeatable, rule-enforcing guides. Anatomy: title, intent blockquote (which rules it
applies), numbered steps, and the quality-gate block. Precedence: if a skill ever disagrees
with `rules/`, **rules/ wins** — fix the skill.

Every skill ends the same way:

    npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan

## Simple code & cleanup

- [write-simple-readable-code.md](./write-simple-readable-code.md) — the Simple Code Ladder applied to every new line.
- [simplify-existing-code.md](./simplify-existing-code.md) — extract · split · de-inline · delete, by ownership.
- [full-codebase-cleanup.md](./full-codebase-cleanup.md) — repo-wide sweep orchestration, gates green per slice.
- [cleanup-without-weakening-safety.md](./cleanup-without-weakening-safety.md) — refactoring the privacy/AI-safety/upload surfaces behavior-identically.
- [prepare-agent-mirrors.md](./prepare-agent-mirrors.md) — keep every agent entrypoint compact and aligned.

## Backend

- [create-module.md](./create-module.md) — scaffold a feature module: canonical tree + `index.ts` public surface + AppModule registration.
- [create-controller.md](./create-controller.md) — thin `api/` controller: exactly one delegation per handler.
- [create-dto-validation.md](./create-dto-validation.md) — strict Zod DTOs in `api/dto` backed by packages/shared; global validation pipe.
- [create-service.md](./create-service.md) — one-capability `application/` service, methods ≤ 20 lines.
- [create-use-case.md](./create-use-case.md) — multi-step orchestration in `application/*.use-case.ts` (canonical playbook).
- [create-manager-use-case.md](./create-manager-use-case.md) — the retired "manager" name + the analyze-game worked example.
- [create-repository.md](./create-repository.md) — `infrastructure/` persistence pattern; binds when a store is ever approved.
- [create-error.md](./create-error.md) — AppError subclass + messageKey + filter mapping + envelope compatibility.
- [add-api-service-method.md](./add-api-service-method.md) — extend an existing backend service safely.
- [add-ai-provider.md](./add-ai-provider.md) — add/swap an AI provider behind the port without changing contracts.
- [secure-file-upload.md](./secure-file-upload.md) — touch the upload security chain without breaking its invariants.

## Frontend

- [create-feature.md](./create-feature.md) — scaffold `features/NAME` with ui/hooks/services/gateways/model/lib.
- [create-component.md](./create-component.md) — pure-composition TSX component.
- [create-hook.md](./create-hook.md) — controller hook owning state/effects/handlers.
- [create-service-layer.md](./create-service-layer.md) — frontend service between hook and gateway.

## Quality & Review

- [write-unit-tests.md](./write-unit-tests.md) — Vitest unit tests: projects, fixtures, behavior-first assertions.
- [write-integration-tests.md](./write-integration-tests.md) — boot the full Nest app on Fastify (+ `.ready()`) and drive HTTP.
- [write-e2e-tests.md](./write-e2e-tests.md) — Playwright journeys in apps/web with a mocked backend.
- [fix-eslint-typecheck.md](./fix-eslint-typecheck.md) — fix root causes; directory of the custom architecture rules.
- [decompose-large-file.md](./decompose-large-file.md) — split by responsibility into `lib/` / `domain/` / `model/`.
- [investigate-production-bug.md](./investigate-production-bug.md) — failing test first, fix the owning layer, regression-lock.
- [security-review.md](./security-review.md) — uploads, secrets, envelope, AI safety, privacy invariants.
- [injection-safety-review.md](./injection-safety-review.md) — prompt placeholders, clamd framing, future DB parameterization.
- [observability-review.md](./observability-review.md) — redaction, request-id correlation, 4xx/5xx levels, safe envelope.
- [performance-review.md](./performance-review.md) — caps, timeouts, bundle size, memory hygiene.
- [reliability-review.md](./reliability-review.md) — failure injection, fail-safe side effects, fail-closed scanning.
- [accessibility-review.md](./accessibility-review.md) — keyboard, contrast, reduced motion, screen reader.
- [final-validation.md](./final-validation.md) — all gates + docker + manual QA + the validation report.

## Platform

- [add-config-value.md](./add-config-value.md) — Zod env schema -> typed getter -> `.env.example` -> docs, fail-fast test.
- [add-library.md](./add-library.md) — vet, wrap behind a port, register in `eslint/package-boundaries.config.mjs`.
- [modularize-existing-library.md](./modularize-existing-library.md) — retrofit a wrapper around a direct dependency.
- [add-i18n-message-key.md](./add-i18n-message-key.md) — backend messageKey + frontend dictionary key, same change.
- [add-guard-and-permission.md](./add-guard-and-permission.md) — throttle + consent today; auth-chain blueprint if identity is ever approved.
- [add-event-handler.md](./add-event-handler.md) — (not applicable today) the event pattern the moment a bus exists.
- [add-notification.md](./add-notification.md) — (not applicable today) the notification pattern behind adapter + event.
- [add-migration-backfill.md](./add-migration-backfill.md) — (not applicable today) reversible migrations + chunked backfills.
- [migration-plan.md](./migration-plan.md) — (not applicable today) expand/migrate/contract planning before DDL.
