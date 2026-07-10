# Skill: Fix ESLint / Typecheck Failures

> Applies rules/11. Fix the code, never the rules.

1. `npm run typecheck` builds shared and runs strict `tsc --noEmit` across every workspace plus web
   E2E — trust its
   output (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, ...); the error names
   the broken contract between layers.
2. Read the failing lint rule name; custom rules live in `eslint/architecture-plugin/rules`:
   - `architecture/controller-no-logic` — controllers: one delegation, zero logic.
   - `architecture/no-restricted-layer-imports` — layer order api -> application ->
     domain/infrastructure/adapters; cross-module imports via `index.ts` only.
   - `architecture/no-inline-domain-definitions` — types/constants/schemas belong in
     `model/`, `api/dto/`, or `packages/shared`, never inline.
   - `architecture/no-direct-sdk-imports` — vendor SDKs only inside `adapters/`.
   - `architecture/no-direct-env-access` — `process.env` only in `src/config`
     (and `src/bootstrap`).
   - `architecture/no-raw-library-imports` — wrapped libraries only (`lib/` / `adapters/`).
   - `architecture/repository-persistence-only` — repositories hold persistence calls only.
   - `architecture/application-layer-boundaries` — service/use-case size and dependency
     limits (methods ≤ 20 lines, one-way dependencies).
   - `architecture/tsx-pure-composition` — TSX renders; hooks and lib think.
   - `architecture/no-restricted-vendor-imports` — vendors are owned where
     `eslint/package-boundaries.config.mjs` says they are, nowhere else.
3. Fix the design issue the rule points at (move logic to the right layer, extract the type,
   wrap the library) — never the symptom.
4. FORBIDDEN: `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `any`, non-null `!`,
   loosening tsconfig/eslint.
5. A genuinely false positive is discussed and documented in docs/eslint-architecture.md —
   config changes go through that file, never inline suppressions.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
