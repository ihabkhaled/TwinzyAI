# 01 — Architecture

Monorepo: npm workspaces. apps/web (Next.js), apps/api (NestJS), packages/shared,
packages/tsconfig, packages/eslint-config.

Backend flow: Controller -> Manager -> Service -> Repository. Adapters wrap external systems and
are called from services only. Repository is omitted where there is no persistence (this app
persists nothing by design).

Frontend flow: Component -> Hook -> Service -> Gateway -> Backend. Features are self-contained
under features/NAME/ with ui/, hooks/, services/, gateways/, model/, lib/.

Shared code both sides need (schemas, constants, enums) lives in packages/shared — never
duplicated. Barrel index.ts files are public module entrypoints only; no giant barrels, no cycles.
