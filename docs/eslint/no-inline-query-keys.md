# frontend-architecture/no-inline-query-keys

- **Source:** `apps/web/eslint/architecture-plugin/rules/no-inline-query-keys.mjs`
- **Registered in:** `apps/web/eslint/architecture.config.mjs` (severity `error`)
- **Options:** none (`schema: []`)

## What it enforces

TanStack Query keys are cache addresses. Any object property named `queryKey` or `mutationKey`
whose value is an inline array literal is reported. Keys MUST come from a `*query-keys.ts` builder
file — for the game module, `gameQueryKeys` in
`apps/web/src/modules/game/queries/game-query-keys.ts`. Builder files themselves and test files
are exempt.

## Why

Inline key arrays fragment the cache: `['game', 'result']` here, `['game-result']` there, and
suddenly `invalidateQueries` misses half the entries after a mutation — stale results that no
test catches. With a single builder per module, key shape changes happen in one file and
invalidation stays exact (see `invalidateGameResults` in
`apps/web/src/modules/game/queries/game.invalidate.ts`).

## Targeted files

All of `apps/web/src/**/*.{ts,tsx}` except `*query-keys.ts` files and tests.

## Violation

From `apps/web/eslint/architecture-plugin/__fixtures__/invalid/bad-client-page.tsx`:

```ts
return { queryKey: ['game', 'result'] };
```

Reported as:

`Inline queryKey arrays are forbidden. Use a builder from the module's *query-keys.ts file so invalidation stays exact.`

## Compliant fix

The builder file is the only source of game cache addresses
(`apps/web/src/modules/game/queries/game-query-keys.ts`):

```ts
export const gameQueryKeys = {
  root: ['game'] as const,
  results: () => [...gameQueryKeys.root, 'result'] as const,
  result: (params: GameResultParams) => [...gameQueryKeys.results(), params] as const,
  details: () => [...gameQueryKeys.root, 'detail'] as const,
  detail: (id: string) => [...gameQueryKeys.details(), id] as const,
};
```

Consumed in the query file (`apps/web/src/modules/game/queries/game.queries.ts`):

```ts
return {
  queryKey: gameQueryKeys.result(params),
  queryFn: () => analyzeGame(params),
};
```

## When you hit it

1. If the module already has a `*query-keys.ts`, use (or extend) its builder — never restate the
   array.
2. New module or entity? Create the builder file first, then the query/mutation:
   [skills/create-service.md](../../skills/create-service.md).
3. Key discipline and invalidation strategy: [rules/04-frontend-services-gateways.md](../../rules/04-frontend-services-gateways.md).
4. General procedure: [skills/fix-eslint-typecheck.md](../../skills/fix-eslint-typecheck.md).
