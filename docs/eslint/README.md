# Custom ESLint Rules — `frontend-architecture`

This directory documents the 13 custom rules of the local `frontend-architecture` ESLint plugin
for the Next.js frontend in `apps/web`. These rules enforce the parts of the architecture
contract that no off-the-shelf plugin can: JSX-only components, one-way layer imports, package
ownership, env/browser facades, query-key builders, i18n copy discipline, and justified client
boundaries.

> This plugin governs `apps/web` only. The NestJS backend in `apps/api` is governed by the
> separate `eslint-plugin-twinzy-architecture` plugin documented in
> [docs/eslint-architecture.md](../eslint-architecture.md). The two plugins do not overlap.

## Where the code lives

| Piece                                 | Path                                                        |
| ------------------------------------- | ---------------------------------------------------------- |
| Plugin entry (registers all 13 rules) | `apps/web/eslint/architecture-plugin.mjs`                  |
| Rule implementations                  | `apps/web/eslint/architecture-plugin/rules/<rule-name>.mjs` |
| Shared AST / path / policy helpers    | `apps/web/eslint/architecture-plugin/shared/`              |
| Deliberately-invalid fixtures         | `apps/web/eslint/architecture-plugin/__fixtures__/invalid/` |
| Rule test harness                     | `apps/web/src/tests/unit/eslint-architecture-rules.test.ts` |

## How the rules are registered

The `apps/web/eslint.config.mjs` is orchestrator-only; it composes the split configs in
`apps/web/eslint/*.config.mjs`. Two of those configs register this plugin:

- `apps/web/eslint/architecture.config.mjs` registers the plugin under the key
  `frontend-architecture` for `apps/web/src/**/*.{ts,tsx}` and enables 12 of the 13 rules at
  `error`. It also supplies the **one-way layer policy table** (`layerPolicies`) consumed by
  [`no-restricted-layer-imports`](no-restricted-layer-imports.md), and the repo-specific
  `allowedPrefixes` for [`no-process-env-outside-config`](no-process-env-outside-config.md).
- `apps/web/eslint/package-boundaries.config.mjs` registers the same plugin under the key
  `frontend-architecture-boundaries` and enables
  [`no-raw-package-imports`](no-raw-package-imports.md) with the **package ownership map**
  (`packageBoundaries`) — the machine-readable twin of
  [memory/library-boundaries.md](../../memory/library-boundaries.md).

## How the rules are tested

The fixtures under `apps/web/eslint/architecture-plugin/__fixtures__/invalid/` mirror real
source paths so the path-based rules classify them correctly
(`apps/web/src/modules/game/components/bad-result-card.component.tsx`,
`apps/web/src/modules/game/services/bad-game.service.ts`,
`apps/web/src/app/bad-client-page.tsx`). They are deliberate violations, excluded from the
normal lint run by `apps/web/eslint/ignores.config.mjs` and exercised by
`apps/web/src/tests/unit/eslint-architecture-rules.test.ts`, which asserts that each rule
reports the expected messages on them.

## Enforcement

`npm run lint` runs with `--max-warnings=0`; every rule here is severity `error`, so a single
violation fails the lint gate (pre-commit via lint-staged, and CI). An `eslint-disable` for any
of these rules MUST be backed by a documented exception in
[docs/exceptions/](../exceptions/README.md). When a rule fires, follow
[skills/fix-eslint-typecheck.md](../../skills/fix-eslint-typecheck.md).

## Rule index

| Rule                                                                                      | One-line contract                                                                                    |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [no-hooks-in-components](no-hooks-in-components.md)                                        | `*.component.tsx` files never call hooks or import hooks/queries/store layers.                        |
| [no-inline-declarations](no-inline-declarations.md)                                       | Implementation layers never declare inline types/interfaces/enums/constants.                          |
| [no-inline-component-logic](no-inline-component-logic.md)                                  | Components render precomputed props: no handlers, transforms, or config literals.                     |
| [no-restricted-layer-imports](no-restricted-layer-imports.md)                             | One-way dependencies between architecture layers, driven by a policy table.                           |
| [no-raw-package-imports](no-raw-package-imports.md)                                        | Third-party packages import only inside their owning `apps/web/src/packages/<owner>/` wrapper.        |
| [no-cross-module-deep-imports](no-cross-module-deep-imports.md)                            | Other modules are imported only via their public surface `@/modules/<feature>`.                       |
| [no-process-env-outside-config](no-process-env-outside-config.md)                          | Raw `process.env` reads only inside the validated env facade and config files.                        |
| [no-direct-browser-api-outside-packages](no-direct-browser-api-outside-packages.md)        | Browser globals only inside `apps/web/src/packages/browser` and `apps/web/src/packages/storage`.      |
| [no-inline-query-keys](no-inline-query-keys.md)                                            | Query/mutation keys come only from `*query-keys.ts` builder files.                                    |
| [no-raw-i18n-text](no-raw-i18n-text.md)                                                    | Components carry no raw user-facing copy; every visible string is translated upstream.                |
| [no-inline-classname-outside-design-system](no-inline-classname-outside-design-system.md) | Raw `className` strings only in design-system primitives and `*.variants.ts`/`*.styles.ts`.           |
| [require-client-component-reason](require-client-component-reason.md)                      | Every `'use client'` carries a specific `client-boundary-reason` comment.                             |
| [no-server-only-import-in-client](no-server-only-import-in-client.md)                      | Client files never import server-only modules, Node built-ins, or the server env facade.              |

## Related documents

- [rules/11-eslint-typescript.md](../../rules/11-eslint-typescript.md) — the overall lint/typecheck policy.
- [rules/01-architecture.md](../../rules/01-architecture.md) — the layer model these rules enforce.
- [rules/02-frontend-components-tsx.md](../../rules/02-frontend-components-tsx.md) — the JSX-only component contract.
- [agents/README.md](../../agents/README.md) — the reviewer personas for boundary changes.
