# frontend-architecture/no-cross-module-deep-imports

- **Source:** `apps/web/eslint/architecture-plugin/rules/no-cross-module-deep-imports.mjs`
- **Registered in:** `apps/web/eslint/architecture.config.mjs` (severity `error`)
- **Options:** none (`schema: []`)

## What it enforces

A feature module is a black box. Code outside `apps/web/src/modules/<feature>/` may import that
module only through its public surface `@/modules/<feature>` — the module's `index.ts` decides
what is public. Deep imports into another module's internals
(`@/modules/game/services/game.service`) are forbidden. Imports **within** the same module are
unaffected; relative imports are the canonical intra-module style.

## Why

Deep imports turn every internal file into accidental public API: the game team can no longer
rename `services/game.service.ts` or split a hook without breaking the results screen or app
routes. The public `index.ts` is the module's contract; everything else stays refactorable.
This is the module-granularity twin of
[no-restricted-layer-imports](no-restricted-layer-imports.md) (layer granularity) and
[no-raw-package-imports](no-raw-package-imports.md) (vendor granularity).

## Targeted files

All of `apps/web/src/**/*.{ts,tsx}`. The rule resolves `@/…`, `@modules/…`-style aliases and
relative specifiers (see `resolveImportToSourcePath` in
`apps/web/eslint/architecture-plugin/shared/source-utils.mjs`) and fires only when the resolved
target lives inside a **different** module and is not that module's root/`index`.

## Violation

A route or another module reaching into game internals:

```ts
import { ResultCard } from '@/modules/game/components/result-card.component';
```

Reported as:

`Deep import into module 'game' internals is forbidden. Import from '@/modules/game' — its index.ts decides what is public.`

(The same import appears in the fixture
`apps/web/eslint/architecture-plugin/__fixtures__/invalid/bad-game.service.ts`.)

## Compliant fix

Import from the public surface, which `apps/web/src/modules/game/index.ts` curates:

```ts
import { GameFlowContainer } from '@/modules/game';
```

If the symbol you need is not exported from `index.ts`, that is a design decision to make in the
owning module: either export it deliberately (widening the module's contract) or expose a
higher-level container/hook instead. Inside the module itself keep using relative paths, as
`apps/web/src/modules/game/containers/game-flow.container.tsx` does:

```ts
import { ResultCard } from '../components/result-card.component';
```

## When you hit it

1. Check `apps/web/src/modules/<feature>/index.ts` — the export you need may already exist.
2. If not, add it to the module's `index.ts` only if it is genuinely part of the module's
   contract; prefer exporting the container over its internals
   ([skills/create-module.md](../../skills/create-module.md),
   [rules/01-architecture.md](../../rules/01-architecture.md)).
3. If two modules keep needing each other's internals, the shared piece probably belongs in
   `apps/web/src/shared/` — see [skills/decompose-large-file.md](../../skills/decompose-large-file.md).
4. General procedure: [skills/fix-eslint-typecheck.md](../../skills/fix-eslint-typecheck.md).
