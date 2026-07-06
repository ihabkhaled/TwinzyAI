# Skill: Decompose a Large File

> Applies rules/00 (38-40). Limits: 300 lines/file, 80 lines/function, 20 lines per
> application-layer method.

1. Identify responsibilities; name them (validator, mapper, policy, view section...).
2. Extract each to its correct home:
   - backend: pure logic/mappers -> `lib/`; decisions/invariants -> `domain/`;
     types/constants/schemas -> `model/` (or `api/dto/`); orchestration stays in
     `application/`.
   - frontend: logic -> `features/NAME/lib` pure functions; shapes -> `model/`;
     JSX -> child components; state/handlers stay in the hook.
3. Keep public behavior identical; tests green before and after (refactor = no behavior
   change). Move the tests with the code they cover.
4. Re-run lint — the size and layer rules must pass without any threshold change.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
