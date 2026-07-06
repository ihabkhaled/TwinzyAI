# frontend-architecture/no-raw-package-imports

- **Source:** `apps/web/eslint/architecture-plugin/rules/no-raw-package-imports.mjs`
- **Registered in:** `apps/web/eslint/package-boundaries.config.mjs` (plugin key
  `frontend-architecture-boundaries`, severity `error`, with the `packageBoundaries` map)

## What it enforces

Every third-party vendor has exactly one owning wrapper under `apps/web/src/packages/<owner>/`
(or, for a few Next built-ins, a designated shared/test owner). App code imports the app-owned
facade, never the vendor. The ownership map in `apps/web/eslint/package-boundaries.config.mjs` is
the machine-readable twin of [memory/library-boundaries.md](../../memory/library-boundaries.md) —
update both together.

Examples from the map: the HTTP client `→ apps/web/src/packages/http/`,
`@tanstack/react-query → apps/web/src/packages/query/`,
`zustand → apps/web/src/packages/zustand/`, `zod → apps/web/src/packages/zod/`,
`dayjs → apps/web/src/packages/date/`, `next-intl → apps/web/src/packages/i18n/`,
`sonner → apps/web/src/packages/toast/`, `lucide-react → apps/web/src/packages/icons/`,
`clsx`/`tailwind-merge`/`class-variance-authority → apps/web/src/packages/ui-primitives/`,
`msw → apps/web/src/tests/msw/`, `next/link → apps/web/src/packages/link/`,
`next/image → apps/web/src/packages/image/`, `next/navigation → apps/web/src/packages/navigation/`,
`next/font/* → apps/web/src/shared/fonts/`.

## Why

Unwrapped vendor imports scatter a library's API across the codebase: an HTTP-client major upgrade
becomes a 200-file diff, error normalization happens differently per call site, and nobody can
swap or patch the dependency. With one owner, upgrades, security patches, and behavioral policy
(interceptors, defaults, SSR safety) live in a single reviewed directory. See
[rules/10-library-modularization.md](../../rules/10-library-modularization.md) and
[memory/library-boundaries.md](../../memory/library-boundaries.md).

## Violation

From `apps/web/eslint/architecture-plugin/__fixtures__/invalid/bad-game.service.ts`:

```ts
import ky from 'ky';
```

Reported as:

`Import 'ky' only inside its owner wrapper (apps/web/src/packages/http/). Use the app-owned facade instead — see memory/library-boundaries.md.`

## Compliant fix

The real gateway pattern (`apps/web/src/modules/game/gateway/game.gateway.ts`) goes through the
facade:

```ts
import { httpClient } from '@/packages/http';
import { buildGatewayPath } from '@/shared/api/api-routes.constants';
```

Need an icon? `import { ShareIcon } from '@/packages/icons'`. Need a date label?
`formatDisplayDate` from `@/packages/date`. Need a toast? `showToast` from `@/packages/toast`.

## Options

```jsonc
{
  "boundaries": [
    {
      "package": "ky",
      "owners": ["apps/web/src/packages/http/"],
      "matchSubpaths": true,
      "allowInTests": false,
    },
  ],
}
```

- `package` — npm package name, or exact specifier for Next built-ins;
- `matchSubpaths` — default `true` (any subpath of the package matches); set `false` for entries
  like `next/link` where only that exact specifier is owned;
- `owners` — directory prefixes allowed to import the vendor;
- `allowInTests` — set `true` to exempt test files for that package.

## When you hit it

1. Use the existing facade export — the full owner/export list is in
   [memory/library-boundaries.md](../../memory/library-boundaries.md).
2. If the facade is missing a capability, extend the wrapper (do not bypass it).
3. New dependency? Create a wrapper first:
   [skills/add-library.md](../../skills/add-library.md).
4. General procedure: [skills/fix-eslint-typecheck.md](../../skills/fix-eslint-typecheck.md).
