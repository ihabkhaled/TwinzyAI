# Frontend Skills (apps/web)

Skills are the executable procedures of the strict frontend operating system. Every skill follows
the same shape: read the governing rules first, plan tests first, execute numbered steps, run the
validation gate, and check the definition of done. If a task matches a row below, follow that skill
— do not improvise a parallel workflow.

> The flat [README.md](./README.md) is the **backend** skill index. This file indexes the
> **frontend** (`apps/web`, Next.js App Router) skills. Where a skill name is shared between the two
> sides, the frontend variant carries a `-frontend` suffix.

Rules (the "what is allowed") live in `rules/frontend/`. Orientation and worked patterns (the "where
things live") are in [context/frontend/reference-patterns.md](../context/frontend/reference-patterns.md).

The frontend architecture is one-way layered inside each module:

```
app/ (routes only)
  → modules/<feature>/  container → hook → { query/mutation → service → gateway → mapper → schema } · store · components
    → shared/           (generic building blocks, feedback states, test ids, helpers)
      → packages/<vendor>  (the ONE owning wrapper per third-party library)
```

## Build a feature

| Task                                                        | Skill                                                                   |
| ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| Scaffold a new feature module under `apps/web/src/modules/` | [create-module-frontend.md](./create-module-frontend.md)                |
| Add a JSX-only presentational component                     | [create-component.md](./create-component.md)                            |
| Add a client container that wires hooks to components       | [create-container.md](./create-container.md)                            |
| Add a view-model / orchestration hook                       | [create-hook.md](./create-hook.md)                                      |
| Add a React-free service (gateway + mapper composition)     | [create-service-frontend.md](./create-service-frontend.md)             |
| Add a TanStack Query read (keys, options, hook)             | [create-query.md](./create-query.md)                                    |
| Add a mutation with cache invalidation or optimistic update | [create-mutation.md](./create-mutation.md)                              |
| Add client global state with Zustand                        | [create-zustand-store.md](./create-zustand-store.md)                    |
| Add a page or route handler under `apps/web/src/app/`       | [add-route.md](./add-route.md)                                          |
| Add a translated message key (en + ar)                      | [add-i18n-message-key.md](./add-i18n-message-key.md)                    |
| Build a form with `useAppZodForm` and a Zod schema          | [add-form.md](./add-form.md)                                            |
| Render a large list with `VirtualizedList`                  | [add-virtualized-list.md](./add-virtualized-list.md)                    |

## Vendor wrapper

| Task                                                        | Skill                                                                   |
| ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| Wrap a newly-approved third-party package                   | [create-package-wrapper.md](./create-package-wrapper.md)                |
| Retrofit a wrapper around a directly-used package           | [modularize-existing-library.md](./modularize-existing-library.md)     |

Owning wrappers: axios→`@/packages/axios` · @tanstack/react-query→`@/packages/query` ·
zustand→`@/packages/zustand` · zod→`@/packages/zod` · react-hook-form→`@/packages/forms` ·
next-intl→`@/packages/i18n` · sonner→`@/packages/toast` · lucide→`@/packages/icons` ·
cva/clsx/tailwind-merge→`@/packages/ui-primitives` · react-virtuoso→`@/packages/virtuoso` ·
next/link→`@/packages/link` · next/navigation→`@/packages/navigation` · env→`@/packages/env` ·
browser/storage→`@/packages/browser` + `@/packages/storage`.

## Quality & review

| Task                                                        | Skill                                                                   |
| ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| Restructure an existing feature to match the architecture   | [refactor-feature.md](./refactor-feature.md)                            |
| Resolve ESLint or typecheck failures correctly              | [fix-eslint-typecheck-frontend.md](./fix-eslint-typecheck-frontend.md) |
| Review a change for security issues                         | [security-review-frontend.md](./security-review-frontend.md)           |
| Review a change for rendering/bundle performance            | [performance-review-frontend.md](./performance-review-frontend.md)     |
| Review a change for accessibility                           | [accessibility-review-frontend.md](./accessibility-review-frontend.md) |
| Run the full quality gate before merge/release              | [final-validation-frontend.md](./final-validation-frontend.md)         |

## Tests

| Task                                                        | Skill                                                                   |
| ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| Write Vitest unit tests for module code                     | [write-unit-tests-frontend.md](./write-unit-tests-frontend.md)         |
| Write cross-module integration tests with MSW              | [write-integration-tests-frontend.md](./write-integration-tests-frontend.md) |
| Write Playwright end-to-end tests                           | [write-e2e-tests-frontend.md](./write-e2e-tests-frontend.md)           |
| Write axe-based accessibility tests                         | [write-accessibility-tests.md](./write-accessibility-tests.md)         |
| Write Playwright visual regression tests                    | [write-visual-tests.md](./write-visual-tests.md)                       |

## The gate (every skill ends here)

```sh
npm run lint            # ESLint flat config — 0 errors, 0 warnings
npm run typecheck       # tsgo (tsc cross-check), strict
npm run test:coverage   # Vitest — 95% global, 100% pure layers (utils/helpers/mappers/schemas/query-keys)
npm run build           # next build (typedRoutes + env validation)
npm run quality:dead-code   # knip — no orphaned exports/files
npm run quality:circular    # madge — no import cycles
npm run test:e2e            # relevant Playwright suite (add test:a11y / test:visual for UI)
```

## Twinzy product guardrails (never relaxed)

- The game is **free** — no payment, subscription, or monetization UI, ever.
- **No identity / no auth** — there is no login, session token, or account state. Never add one.
- **No image persistence** — the uploaded photo is in memory for the in-flight submission only;
  never store, cache, log, embed, or return it. No client-side face/biometric library.
- Playful **style/vibe** matches from written traits only — never exact-lookalike or identity claims.

## How to use a skill

1. Open the skill and read its "Read first" links before touching code.
2. Follow the steps in order; each step names the exact file paths and exports involved.
3. Run every command in the skill's validation gate — all must pass with zero warnings.
4. Only claim the task done when every item in the definition of done is true.

Skills never grant exceptions. If a step seems impossible without breaking a rule, stop and follow
the approved-waiver process governed by the root `CLAUDE.md` and
`rules/frontend/00-non-negotiable-rules.md` — never work around the guardrail.
