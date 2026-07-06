# Frontend Unit Testing Standard (`apps/web`)

Unit tests run on Vitest 4 in jsdom (`apps/web/vitest.config.mts`, `environment: 'jsdom'`,
`globals: false` — always import `describe`, `it`, `expect` from `vitest` explicitly).

## Location and naming

- Module unit tests live in the module's `test/` directory:
  `apps/web/src/modules/<feature>/test/`. Never colocate `.test.ts` files next to source inside
  other layer directories.
- The test file name mirrors the source file name with a `.test` suffix:

  | Source                                                        | Test                                                             |
  | ------------------------------------------------------------- | ---------------------------------------------------------------- |
  | `apps/web/src/modules/<f>/mappers/<f>.mapper.ts`              | `apps/web/src/modules/<f>/test/<f>.mapper.test.ts`               |
  | `apps/web/src/modules/<f>/utils/<f>.util.ts`                  | `apps/web/src/modules/<f>/test/<f>.util.test.ts`                 |
  | `apps/web/src/modules/<f>/queries/<f>-query-keys.ts`          | `apps/web/src/modules/<f>/test/<f>-query-keys.test.ts`           |
  | `apps/web/src/modules/<f>/hooks/use-<name>.hook.ts`           | `apps/web/src/modules/<f>/test/use-<name>.hook.test.tsx`         |

- Tests for `apps/web/src/shared` and `apps/web/src/packages` follow the same mirror-name rule;
  cross-module suites live under `apps/web/src/tests/unit/`.
- Vitest picks up `apps/web/src/**/*.test.{ts,tsx}` and excludes the Playwright directories
  (`src/tests/e2e`, `src/tests/accessibility`, `src/tests/visual`).

## Structure

- One top-level `describe` per exported function or hook, named after the export
  (`describe('mapMatchListResponse', …)`).
- `it` sentences state observable behavior, not implementation:
  `it('sinks low-confidence matches to the end while preserving relative order')` — the contract
  documented on the function.
- Table-driven tests are the default for pure logic with multiple input classes. Use `it.each` with
  a typed case array:

  ```ts
  const cases: readonly { name: string; input: string; expected: string }[] = [
    { name: 'strips a leading slash', input: '/matches', expected: '/api/gateway/matches' },
    { name: 'accepts a bare path', input: 'matches', expected: '/api/gateway/matches' },
  ];

  it.each(cases)('$name', ({ input, expected }) => {
    expect(buildGatewayPath(input)).toBe(expected);
  });
  ```

  (Both branches of the `startsWith('/')` conditional in `buildGatewayPath` are cases in the table —
  the builder lives in `apps/web/src/shared/api`.)

## Pure logic: 100% branches, no exceptions

Files under `utils/`, `helpers/`, `mappers/`, `schemas/`, and query-key builder files
(`queries/*query-keys*.ts`) carry a 100% threshold for lines, statements, functions, and branches
([coverage-policy.md](coverage-policy.md)). In practice:

- `<f>.mapper.test.ts` proves the snake_case → camelCase contract (e.g. `match_score` →
  `matchScore`, `total_count` → `totalCount`) and the empty-list case of the list mapper.
- `<f>.util.test.ts` covers every comparator branch of a sort/derivation helper — both null, only
  first null, only second null, both present — plus input immutability (`toSorted` returns a new
  array).
- `<f>-query-keys.test.ts` locks the key hierarchy: `matchQueryKeys.list(params)` extends
  `matchQueryKeys.lists()`, which extends `matchQueryKeys.root`. If this suite breaks, cache
  invalidation in the module's `*.invalidate.ts` breaks.

## Rules

- Unit tests MUST NOT render providers, hit MSW, or touch `window` beyond what jsdom gives every
  test. Hook tests use `renderHook` with the narrowest wrapper the hook needs; a hook that needs the
  query client + network gets its full behavior proven at the integration layer instead.
- Never mock the module under test's own internals. Mock only at owned boundaries
  (`apps/web/src/packages/*` facades) and only when the real implementation cannot run in jsdom.
- Test data comes from `apps/web/src/tests/factories` — see
  [test-data-and-fixtures.md](test-data-and-fixtures.md). No inline magic objects.
- No `.only`, no unexplained `.skip` (see [README.md](README.md)).
- Run: `npm run test` (single pass), `npm run test:watch` (TDD loop), `npm run test:coverage` (with
  thresholds enforced).
