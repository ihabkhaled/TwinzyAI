# Known Pitfalls

- Vitest + NestJS DI: esbuild drops decorator metadata; the SWC plugin in vitest.config.ts is
  mandatory for api projects. Do not remove it.
- packages/shared must be built (npm run build:shared) before typecheck/tests/dev of the apps.
- Windows: architecture lint rules must normalize backslash paths (path-utils.mjs does).
- exactOptionalPropertyTypes: omit optional keys instead of assigning undefined.
- Zod v4: z.strictObject for closed shapes; z.enum with tuple of values; nativeEnum is deprecated.
- Next 16: next lint is removed (we run our own eslint); dev/build use Turbopack by default.
- npm workspaces hoist bins to the root node_modules; run tooling from the repo root.
