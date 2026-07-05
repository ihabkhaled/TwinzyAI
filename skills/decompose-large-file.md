# Skill: Decompose a Large File

> Applies rules/00 (38-40). Limits: 300 lines/file, 80 lines/function.

1. Identify responsibilities; name them (validator, mapper, policy, view section...).
2. Extract to the correct home: logic -> utils//lib, shapes -> model/types, JSX -> child
   components, orchestration stays.
3. Keep public behavior identical; tests green before and after (refactor = no behavior change).
4. Re-run lint — the size rules must pass without any threshold change.
Gate: npm run lint && npm run typecheck && npm run test:unit && npm run build
