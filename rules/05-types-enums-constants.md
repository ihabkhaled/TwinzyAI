# 05 — Types, Enums, Constants

- Types in types/ (aliases), interfaces in interfaces/, enums as as-const objects in enums/,
  constants in constants/, Zod schemas in schemas/ (or feature model/).
- Derive types from schemas/constants (z.infer, keyof typeof) — single source of truth.
- Domain values used by both apps live in packages/shared only.
- Documented exception: a TSX file may declare its own XxxProps interface.
