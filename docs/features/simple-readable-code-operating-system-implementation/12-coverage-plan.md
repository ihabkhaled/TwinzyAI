# 12 — Coverage Plan

## Touched modules and thresholds

Target per logic-bearing touched file: at least 95% statements, 90% branches, 95% functions, and 95% lines.

- `apps/api/src/modules/ai/application/*generation*`, `*judge*`, routing/config helpers: modality, failures, filtering, route capability.
- `apps/api/src/modules/game/application/analyze-game*.use-case.ts` and style match: orchestration, fallback, progress, cleanup.
- `apps/api/src/benchmark/**`: text/image step selection and report paths where covered by the benchmark project.
- `packages/shared/src/**` touched schemas/utilities/constants: valid/invalid bounds and exports.
- `apps/web/src/**` touched layout/env/query owners: rendering at 320 px plus existing unit behavior.
- `eslint/**` if changed: rule option/path cases in the `lint-rules` project.

## Critical scenario areas

Image isolation, buffer wipe, AI safety rejection, upload fail-closed behavior, translation canonical-field preservation, and mobile no-overflow are scenario-rich gates regardless of percentage.

## Measurement and evidence

Run `npm run test:coverage`; inspect per-file output for touched logic. Run focused projects first so failures identify the owning slice. E2E/static/build/security evidence supplements line coverage.

## Waiver status

No waiver requested. Decorator-generated synthetic branch handling remains the repository's existing 90% branch policy and is not changed.
