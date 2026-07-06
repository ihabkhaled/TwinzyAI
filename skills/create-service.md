# Skill: Create a Backend Service

> Applies rules/19. One focused capability per class; use cases orchestrate, services do the
> work.

1. File: `apps/api/src/modules/NAME/application/NAME.service.ts` — one capability, methods
   ≤ 20 lines each (plugin-enforced: `architecture/application-layer-boundaries`).
2. Collaborate with adapters and repositories through their interfaces; config comes from
   `AppConfigService` only — never `process.env` (`architecture/no-direct-env-access`).
3. Extract branching and computation into `lib/` pure functions or `domain/` policies;
   validate any untrusted data with Zod schemas from `model/` or `packages/shared`.
4. Map every failure to a typed `AppError` subclass carrying a stable
   `messageKey` (`errors.NAME.<key>`) — see create-error.md. Never `throw new Error(...)`.
5. Dependency direction is one-way: services never call use cases and never import `api/`.
6. Unit tests: happy path plus every failure mapping, collaborators mocked
   (write-unit-tests.md).

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
