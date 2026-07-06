# Skill: Add an API Service Method → routed

Adding one capability to an existing service is a layer-specific task. Pick the side you are on:

## Frontend (`apps/web`)

Extend a module's data layer, not a giant service:

- Add a **read** → [create-query.md](./create-query.md) (query-key builder + `useAppQuery` + service
  use-case).
- Add a **write** → [create-mutation.md](./create-mutation.md) (`useAppMutation` + exact-scope
  invalidation helper).
- Add a React-free **use-case** to a module `services/` file →
  [create-service-frontend.md](./create-service-frontend.md) (gateway → mapper → domain, one verb
  function, errors propagated).

Frontend skill index: [README-frontend.md](./README-frontend.md).

## Backend (`apps/api`)

Extend a focused NestJS `application/` service (method ≤ 20 lines, helpers to `lib/`, Zod-validated
input, typed `AppError` with a stable `messageKey`, unit test per path):

- One capability on an existing service → [create-service.md](./create-service.md).
- Multi-step orchestration → [create-use-case.md](./create-use-case.md).

Backend skill index: [README.md](./README.md).
