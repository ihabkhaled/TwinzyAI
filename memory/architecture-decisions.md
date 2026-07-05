# Architecture Decisions

- npm workspaces (not pnpm/yarn): required stack default, zero extra tooling.
- packages/shared compiles to CJS dist consumed by both apps; single source for schemas/constants.
- Health module follows full Controller -> Manager -> Service chain for pattern consistency,
  even though it is trivial — the codebase demonstrates exactly one way to build modules.
- No repository layer exists yet because nothing is persisted (privacy by design).
- eslint config lives in /eslint at the root; packages/eslint-config only re-exports it.
