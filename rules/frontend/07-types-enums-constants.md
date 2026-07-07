# 07 — Types, Enums, and Constants

Every name a human might retype — route, key, id, status, message key — exists exactly once, in a
typed catalog. Everything else imports it.

## Enums: `as const` objects, never the `enum` keyword

The TypeScript `enum` keyword is banned (non-negotiable 5 in
[00-non-negotiable-rules.md](00-non-negotiable-rules.md), and a repo-wide Twinzy product
non-negotiable in [CLAUDE.md](../../CLAUDE.md)): it emits runtime objects, behaves badly with
`verbatimModuleSyntax`/`isolatedModules`, and its numeric form is unsound. The repo pattern is an
`as const` object plus a derived value type:

```ts
export const AppTheme = {
  Light: 'light',
  Dark: 'dark',
  System: 'system',
} as const;

export type AppThemeValue = (typeof AppTheme)[keyof typeof AppTheme];
```

(`apps/web/src/shared/enums/app-theme.enum.ts`; same pattern in `app-direction.enum.ts` and module
enums like `apps/web/src/modules/articles/enums/article-status.enum.ts`.)

Rules: enum files (`*.enum.ts`) contain only the object and derived types; switches over enum values
MUST end in `assertNever` so adding a member is a compile error at every consumer.

## Types-only files

`types/*.types.ts` files declare types and interfaces only — no values, no functions, no side
effects. Wire shapes live separately in `api/*.api.types.ts` (snake_case, matching the backend),
domain and view-model types in `types/` (camelCase). Reference:
`apps/web/src/modules/articles/types/article.types.ts` and
`apps/web/src/modules/articles/api/articles.api.types.ts`. Shared cross-module types (e.g.
pagination) live in `apps/web/src/shared/types/pagination.types.ts`; cross-side contracts shared with
the backend come from `@twinzy/shared` (`packages/shared`). Use `import type` everywhere —
`verbatimModuleSyntax` makes anything else an error.

## The shared constants catalogs

| Catalog               | File                                                                        | Holds                                                                                                            |
| --------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `ROUTE_PATHS`         | `apps/web/src/shared/constants/route-paths.constants.ts`                    | Every navigable path: `home '/'`, `game '/game'`, `privacy '/privacy'`, `terms '/terms'`, `help '/help'`. Used with `AppLink`/`useAppNavigation`. |
| `STORAGE_KEYS`        | `apps/web/src/shared/constants/storage-keys.constants.ts`                   | All web-storage keys, consumed only via `@/packages/storage`.                                                   |
| `TEST_IDS`            | `apps/web/src/shared/constants/test-ids.constants.ts`                       | Every `data-testid`; indexed ids via `buildIndexedTestId` (`apps/web/src/shared/testing/test-id.helper.ts`).   |
| `ERROR_MESSAGE_KEYS`  | `apps/web/src/shared/errors/error-keys.constants.ts`                        | Translatable error keys produced by `mapErrorToMessageKey`.                                                     |
| `I18N_NAMESPACES`     | `apps/web/src/shared/i18n/i18n-namespaces.constants.ts`                     | Message-catalog namespaces passed to `useAppTranslation`.                                                       |
| `LANDMARK_IDS`        | `apps/web/src/shared/accessibility/landmark-ids.constants.ts`               | Skip-link / landmark anchor ids.                                                                                |
| `API_ROUTES`          | `apps/web/src/shared/api/api-routes.constants.ts`                           | BFF paths + `buildGatewayPath`.                                                                                 |
| `FALLBACK_ERROR_COPY` | `apps/web/src/shared/constants/fallback-copy.constants.ts`                  | The single sanctioned raw-copy exception, used only by `apps/web/src/app/global-error.tsx`.                     |

Module-scoped names follow the same shape in `apps/web/src/modules/<feature>/constants/` — endpoints
(`ARTICLE_ENDPOINTS`), message keys (`ARTICLE_MESSAGE_KEYS`), style bundles
(`article-style.constants.ts`), defaults (`ARTICLES_DEFAULT_PAGE_SIZE`).

## No inline declarations in layer files

The catalogs only hold if nothing bypasses them. Module-level types, interfaces, enums, and
non-function `const` values are banned inside component, container, hook, service, gateway, query,
and route files — types/interfaces/enums belong in `types/` (or `model/`, `enums/`), and reusable
values and `as const` maps belong in `constants/` (or `model/`). This is mechanically enforced by
`frontend-architecture/no-inline-declarations`. The one sanctioned exception is a `*.variants.ts`
design-system bundle, the approved home for inline class strings, which the rule exempts. (The
backend counterpart, `architecture/no-inline-domain-definitions`, is scoped to `apps/api` — one
reason web `*.variants.ts` bundles stay valid.)

## Rules

- Every catalog is `as const`; values are typed string literals, never `string`.
- Adding a screen/flow MUST extend the catalogs first (route, test ids, message keys), then use them
  — see [skills/add-route.md](../../skills/add-route.md) and
  [skills/add-i18n-message-key.md](../../skills/add-i18n-message-key.md).
- A string literal that appears in two files is a defect: hoist it into the owning catalog.
- Constants files never import from components, hooks, or services — they sit at the bottom of the
  dependency graph (layer policy in [eslint/architecture.config.mjs](../../eslint/architecture.config.mjs)).
