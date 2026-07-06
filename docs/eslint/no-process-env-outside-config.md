# frontend-architecture/no-process-env-outside-config

- **Source:** `apps/web/eslint/architecture-plugin/rules/no-process-env-outside-config.mjs`
- **Registered in:** `apps/web/eslint/architecture.config.mjs` (severity `error`, with repo-specific `allowedPrefixes`)

## What it enforces

Raw `process.env` access (including `process['env']`) is only allowed inside the validated env
facade and configuration files. Everywhere else, code consumes the parsed objects from the env
wrapper: `publicEnv` from `@/packages/env` on the client, and `getServerEnv()` from
`@/packages/env/server` (guarded by the `server-only` marker) on the server.

## Why

`process.env.X` is `string | undefined` and silently `undefined` when a variable is missing or
misspelled — the failure surfaces as a broken feature deep at runtime instead of a startup error.
The facade Zod-validates every variable once at the boundary (with local defaults per
`.env.example`), so a malformed environment fails fast and typed values flow from there. It also
keeps server-only variables (`SERVER_API_BASE_URL`, `SERVER_API_MOCKING`) structurally out of
client bundles. See [rules/25-configuration-and-environment.md](../../rules/25-configuration-and-environment.md).

## Targeted files

All of `apps/web/src/**/*.{ts,tsx}` except the allowed prefixes configured in
`apps/web/eslint/architecture.config.mjs`:

```js
allowedPrefixes: [
  'apps/web/src/packages/env/',
  'apps/web/src/shared/config/',
  'apps/web/src/tests/setup/',
  'apps/web/src/tests/e2e/',
  // The CSP proxy branches on NODE_ENV before the env facade exists.
  'apps/web/src/proxy.ts',
],
```

## Violation

From `apps/web/eslint/architecture-plugin/__fixtures__/invalid/bad-game.service.ts`:

```ts
const baseUrl = process.env.NEXT_PUBLIC_API_URL;
```

Reported as:

`Do not read process.env here. Import publicEnv/serverEnv from @/packages/env so values are validated once at the boundary.`

## Compliant fix

```ts
// Client-safe values (NEXT_PUBLIC_*)
import { publicEnv } from '@/packages/env';

const appUrl = publicEnv.NEXT_PUBLIC_APP_URL;
```

```ts
// Server-only values — only in server code (route handlers, gateway handler)
import { getServerEnv } from '@/packages/env/server';

const { SERVER_API_BASE_URL } = getServerEnv();
```

Derived app-level settings belong in `apps/web/src/shared/config/app-config.ts` (`appConfig`),
which is itself inside the allowed prefixes.

## Options

```jsonc
{ "allowedPrefixes": ["apps/web/src/packages/env/", "apps/web/src/shared/config/", "…"] }
```

When omitted, the rule's built-in defaults apply (the same list minus `apps/web/src/proxy.ts`).
Extend the list only through `apps/web/eslint/architecture.config.mjs` review with a comment
explaining why, as done for `apps/web/src/proxy.ts`.

## When you hit it

1. Need a new variable? Add it to the env schema in `apps/web/src/packages/env/` and document it
   in `.env.example` first — see [skills/add-config-value.md](../../skills/add-config-value.md)
   and [rules/25-configuration-and-environment.md](../../rules/25-configuration-and-environment.md).
2. Then read it via `publicEnv` / `getServerEnv()`; never inline `process.env`.
3. Exceptions require a record in [docs/exceptions/](../exceptions/README.md).
