# 10 — ESLint and TypeScript

Static analysis is the primary enforcement layer of this OS: if a rule in `rules/frontend/` matters,
an ESLint rule or compiler flag backs it. Lint runs with zero tolerance for warnings — a warning is a
failure, not advice.

## Flat config layout

The root [eslint.config.mjs](../../eslint.config.mjs) is an orchestrator only — it composes the split
configs under [eslint/](../../eslint/) and defines no rules itself. Order matters:
`ignores.config.mjs` first, `prettier.config.mjs` last. Each concern has its own file (`base`,
`typescript`, `react`, `react-hooks`, `next`, `imports`, `promise`, `regexp`, `security`, `sonar`,
`unicorn`, `architecture`, `package-boundaries`, `test`, `prettier`). Never add a rule to the root
file; edit the config that owns the concern. The frontend rule set is scoped to `apps/web` so it does
not collide with the NestJS backend's rules in the same monorepo.

## The frontend-architecture plugin

The local plugin lives at [eslint/architecture-plugin.mjs](../../eslint/architecture-plugin.mjs) with
rule implementations and shared AST/policy helpers under `eslint/architecture-plugin/`, and is applied
to `apps/web` via [eslint/architecture.config.mjs](../../eslint/architecture.config.mjs). Its 13
frontend rules, each documented in [docs/eslint/](../../docs/eslint/):

| Rule                                                                                                       | One-liner                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [no-hooks-in-components](../../docs/eslint/no-hooks-in-components.md)                                       | `*.component.tsx` files must not call hooks — behavior lives in hooks/containers.                                                                |
| [no-inline-declarations](../../docs/eslint/no-inline-declarations.md)                                      | Objects/arrays/functions must be declared in constants/variants/helper files, not inline.                                                        |
| [no-inline-component-logic](../../docs/eslint/no-inline-component-logic.md)                                 | Components render pre-computed props; computation in a component file is an error.                                                               |
| [no-restricted-layer-imports](../../docs/eslint/no-restricted-layer-imports.md)                            | One-way layer dependencies, driven by the policy table in [eslint/architecture.config.mjs](../../eslint/architecture.config.mjs).                |
| [no-raw-package-imports](../../docs/eslint/no-raw-package-imports.md)                                       | Vendor packages import only inside their owning wrapper, per [eslint/package-boundaries.config.mjs](../../eslint/package-boundaries.config.mjs). |
| [no-cross-module-deep-imports](../../docs/eslint/no-cross-module-deep-imports.md)                           | Cross-module imports go through `@/modules/<feature>` public surfaces only.                                                                      |
| [no-process-env-outside-config](../../docs/eslint/no-process-env-outside-config.md)                        | `process.env` reads only inside the env package / config layer.                                                                                  |
| [no-direct-browser-api-outside-packages](../../docs/eslint/no-direct-browser-api-outside-packages.md)      | `window`/`document`/storage only via `@/packages/browser` and `@/packages/storage`.                                                              |
| [no-inline-query-keys](../../docs/eslint/no-inline-query-keys.md)                                           | Query keys come from builder files, never inline arrays.                                                                                          |
| [no-raw-i18n-text](../../docs/eslint/no-raw-i18n-text.md)                                                   | No hardcoded user-facing copy; everything is a translation key.                                                                                  |
| [no-inline-classname-outside-design-system](../../docs/eslint/no-inline-classname-outside-design-system.md) | Raw `className` strings only in variants files and design-system primitives.                                                                     |
| [require-client-component-reason](../../docs/eslint/require-client-component-reason.md)                     | Every `'use client'` needs a `// client-boundary-reason:` comment.                                                                               |
| [no-server-only-import-in-client](../../docs/eslint/no-server-only-import-in-client.md)                     | Server-only modules (e.g. `@/packages/env/server`) never reach client code.                                                                      |

## No inline declarations in layer files

Reusable structure must live in a dedicated file, never inline in a logic or presentation file — this
extends `no-inline-declarations` past objects/arrays/functions to the type-level itself. Types,
interfaces, and enums belong in `types/` (or `model/`/`enums/`); reusable value/config consts and
`as const` maps belong in `constants/` (or `model/`). On the frontend,
`frontend-architecture/no-inline-declarations` bans module-level types/interfaces/enums and
non-function consts in component/container/hook/service/gateway/query/route files; the one approved
home for class strings stays a `*.variants.ts` design-system bundle. The backend mirrors this via
`architecture/no-inline-domain-definitions`, which now also bans module-level value/config `const` in
`apps/api` layer files (controllers, services, use-cases, repositories, adapters, and the
api/application/infrastructure roots) — function-valued consts, `new`/call-expression wiring
(DI/factories), and the single approved `LOG_CONTEXT`/`LOG_PREFIX` are exempt. The `apps/api` scope is
deliberate so web `*.variants.ts` class-string bundles stay valid.

## Components split into small chunks

`*.component.tsx` and `*.container.tsx` files stay small and single-responsibility: split into
sub-components/sub-containers before a god-component forms.
[eslint/frontend/component-size.config.mjs](../../eslint/frontend/component-size.config.mjs) enforces
this with `max-lines` (130), `max-lines-per-function` (60), and `react/jsx-max-depth` — tighter than
the repo-wide 300/80 base. A `.component.tsx` is pure JSX: it may not call hooks
(`no-hooks-in-components`) or hold logic, `.map()`, or inline handlers (`no-inline-component-logic`).
When a view must map a list or hold body variables it becomes a container (e.g.
`game-result.container`, `game-processing.container`), which may map.

## TypeScript: strict family, all on

[apps/web/tsconfig.json](../../apps/web/tsconfig.json) extends the shared
[tsconfig.base.json](../../tsconfig.base.json) and enables the full strict set and the traps beyond it:
`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`,
`noPropertyAccessFromIndexSignature`, `noFallthroughCasesInSwitch`, `noImplicitReturns`,
`noUnusedLocals`, `noUnusedParameters`, `useUnknownInCatchVariables`, `verbatimModuleSyntax`,
`isolatedModules`. None of these flags may be weakened; scoped configs extend the base rather than fork
it. Path aliases (`@/*` and the `@modules`/`@shared`/`@packages` roots) are the only import roots — no
relative walks across top-level areas.

## Typecheck via tsgo

`npm run typecheck` runs across the workspaces; the monorepo ships **tsgo**
(`@typescript/native-preview`) at the root for a dramatically faster check than `tsc`, and `apps/web`
runs strict `tsc --noEmit -p tsconfig.json`. Typecheck gates [.husky/pre-push](../../.husky/). Both
tsgo and `tsc` MUST be clean; there is no "warnings allowed" mode.

## No inline suppression (absolute)

**Inline ESLint suppression is forbidden with no exceptions.** Never write `eslint-disable`,
`eslint-disable-line`, `eslint-disable-next-line`, or `eslint-enable` — anywhere, for any reason.
There is no "documented exception", no "clean it up later", no approval that permits it: no
[docs/exceptions/](../../docs/exceptions/) entry can authorize an inline disable. A lint rule firing
means the code is wrong or in the wrong layer — **fix the root cause or move the code; never silence
the linter.**

This is mechanically enforced by `eslint-comments/no-use: error` (in
[eslint/eslint-comments.config.mjs](../../eslint/eslint-comments.config.mjs)) plus
`reportUnusedDisableDirectives: error`, so writing a directive comment is itself a lint error and the
build fails. The same absolute ban already applies to `@ts-ignore`, `@ts-expect-error`, and
`@ts-nocheck` via `@typescript-eslint/ban-ts-comment`; `any` and non-null assertions (`!`) stay banned
by the typed-lint rules in [eslint/typescript.config.mjs](../../eslint/typescript.config.mjs). Turning
a rule down inside an `eslint/*.config.mjs` file is a separate, reviewed concern — an inline directive
comment in source is never one of them.

When the gate breaks: [skills/fix-eslint-typecheck.md](../../skills/fix-eslint-typecheck.md).
Full per-rule reference: [docs/eslint/](../../docs/eslint/).
