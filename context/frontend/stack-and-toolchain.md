# Frontend Stack and Toolchain

Every frontend dependency, why it is here, and which facade owns it. This is the target stack for
the Twinzy frontend OS (`apps/web`); the canonical dependency list is `apps/web/package.json`.
Raw vendor imports outside the owner wrapper are an ESLint error — see
[`context/frontend/package-boundaries.md`](./package-boundaries.md). Adapted from the reference
frontend OS.

Node `>=22.0.0`, npm `>=10.0.0`; the repo is an npm-workspaces monorepo
(`apps/api`, `apps/web`, `packages/shared`). Transitive-vulnerability fixes use an `overrides`
entry whose spec string mirrors the direct dependency exactly (the documented playbook — see
[`memory/frontend/security-decisions.md`](../../memory/frontend/security-decisions.md)).

## Runtime dependencies

| Package                                              | Version                  | Why chosen                                                                   | Owner wrapper                                                                                                                                          |
| ---------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `next`                                               | ^16.2.10                 | App Router + Turbopack + typedRoutes; the platform.                          | `src/app` for routing; `next/link` → `packages/link`, `next/image` → `packages/image`, `next/navigation` → `packages/navigation`, `next/font/*` → `shared/fonts` |
| `react`, `react-dom`                                 | ^19.2.7                  | React 19; Server Components + Actions era.                                   | Used directly (framework, not a vendor to wrap)                                                                                                       |
| `typescript`                                         | ^5.9.3 (dev)             | Strict-mode contract for everything; typecheck runs via tsgo.                | n/a (toolchain)                                                                                                                                       |
| `axios`                                              | ^1.18.1                  | Interceptable HTTP client with predictable error objects.                    | `packages/axios` (`httpClient`, `HttpError`, `isHttpError`, `normalizeToHttpError`)                                                                   |
| `@tanstack/react-query` (+ devtools)                 | ^5.101.2                 | Server-state cache: dedupe, retries, invalidation.                           | `packages/query` (`AppQueryProvider`, `useAppQuery`, `useAppMutation`, …)                                                                             |
| `zustand`                                            | ^5.0.14                  | Minimal client global state; no boilerplate, selector-based.                 | `packages/zustand` (`createAppStore`, `useAppStoreShallow`)                                                                                           |
| `zod`                                                | ^4.4.3                   | Runtime validation for wire payloads, forms, env, storage.                   | `packages/zod` (`z`, `parseSchema`, `safeParseSchema`, `SchemaParseError`)                                                                            |
| `dayjs`                                              | ^1.11.21                 | Small immutable date library; locale-aware formatting.                       | `packages/date` (`formatDisplayDate`, `formatRelativeToNow`, …)                                                                                       |
| `react-hook-form` + `@hookform/resolvers`            | ^7.81.0 / ^5.4.0         | Uncontrolled forms with Zod resolver; performant re-renders.                 | `packages/forms` (`useAppZodForm`, `AppRegisteredFieldProps`)                                                                                         |
| `next-intl`                                          | ^4.13.1                  | Cookie-based locale (en + ar), server + client APIs, RTL support.            | `packages/i18n` (`useAppTranslation`, `getServerTranslations`, catalogs in `packages/i18n/messages/`)                                                 |
| `sonner`                                             | ^2.0.7                   | Accessible toast primitive.                                                  | `packages/toast` (`showToast`, `ToastType`, `AppToaster`)                                                                                             |
| `lucide-react`                                       | ^1.23.0                  | Tree-shakeable icon set.                                                     | `packages/icons` (named `*Icon` exports only)                                                                                                         |
| `react-virtuoso`                                     | ^4.18.10                 | Virtualized long lists without manual measurement.                           | `packages/virtuoso` (`VirtualizedList`)                                                                                                               |
| `clsx`, `tailwind-merge`, `class-variance-authority` | ^2.1.1 / ^3.6.0 / ^0.7.1 | Class composition + conflict resolution + variant API for the design system. | `packages/ui-primitives` (`cn`, `Button`, `Card`, `buttonVariants`, …)                                                                               |
| `server-only`                                        | ^0.0.1                   | Build-time guard: server env can never leak into client bundles.             | Imported by `packages/env/server`                                                                                                                     |
| `@twinzy/shared`                                     | workspace `*`            | Cross-side constants/enums/schemas/types (incl. safety constants).           | Consumed directly as a workspace package; frontend-only concerns still get a `packages/` wrapper                                                      |

## Dev toolchain

| Tool                                                   | Version                    | Role                                                                                                                                                                                             |
| ------------------------------------------------------ | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@typescript/native-preview` (tsgo)                    | ^7.0.0-dev                 | Fast typecheck (`npm run typecheck`); `typecheck:tsc` is the fallback (`tsc --noEmit`).                                                                                                          |
| `eslint` + `typescript-eslint`                         | ^9.39.4 / ^8.62.1          | Flat config; the orchestrator composes modular configs incl. the local `frontend-architecture` plugin (layer-boundary + package-boundary custom rules).                                          |
| ESLint plugins                                         | see package.json           | `import-x`, `jsx-a11y`, `react`, `react-hooks`, `promise`, `regexp`, `security`, `sonarjs`, `unicorn`, `unused-imports`, `@next/eslint-plugin-next`, `@tanstack/eslint-plugin-query`, `@vitest/eslint-plugin`, `eslint-plugin-playwright`, `eslint-plugin-testing-library`, `eslint-config-prettier`. |
| `tailwindcss` + `@tailwindcss/postcss`                 | ^4.3.2                     | CSS-first tokens in `src/app/styles.css`; dark theme via `[data-theme='dark']`.                                                                                                                  |
| `vitest` + `@vitest/coverage-v8`                       | ^4.1.9                     | Unit/integration tests, jsdom; 95% global / 100% pure-layer coverage thresholds.                                                                                                                 |
| `@testing-library/react` (+ dom, jest-dom, user-event) | ^16.3.x                    | User-visible behavior assertions only.                                                                                                                                                           |
| `msw`                                                  | ^2.14.6                    | Network mocking; owner is `src/tests/msw` (test-only vendor).                                                                                                                                    |
| `@playwright/test` + `@axe-core/playwright`            | ^1.61.1 / ^4.x             | E2E (`test:e2e`), accessibility (`test:a11y`), visual (`test:visual`) suites.                                                                                                                     |
| `husky` + `lint-staged` + `@commitlint/*`              | —                          | Hooks: pre-commit lint-staged, commit-msg conventional commits, pre-push typecheck + test.                                                                                                        |
| `knip`                                                 | ^5.x                       | Dead-code gate (`quality:dead-code`). Pinned to the 5.x line (see pitfalls).                                                                                                                      |
| `madge`                                                | ^8.0.0                     | Circular-dependency gate (`quality:circular`).                                                                                                                                                    |
| `prettier`                                             | ^3.x                       | Formatting (`format`, `format:check`).                                                                                                                                                            |
| `npm-check-updates`                                    | ^22.x                      | Dependency currency (`deps:check` / `deps:upgrade`).                                                                                                                                              |
| Trivy (external binary)                                | —                          | `security:scan`: vuln + secret + misconfig, exit-code 1 on any severity.                                                                                                                          |

> `apps/web/package.json` is bootstrapped incrementally by the frontend workstream; the table above
> is the target frontend OS stack. When a dependency lands, confirm the version and add its owner
> wrapper before writing any raw import.

## Script map

`dev` (`next dev --webpack`, port 3000) / `build`, `dev:e2e` (port 3100 for Playwright),
`lint` (`--max-warnings=0`), `typecheck` (tsgo) with `typecheck:tsc` fallback, `test` /
`test:coverage`, `test:e2e` / `test:a11y` / `test:visual`, `security:audit` / `security:scan`,
`quality:dead-code` / `quality:circular`, `quality` (lint + typecheck + coverage + build), and
`validate` — the full release gate that runs everything. See
[`rules/frontend/19-release-gates.md`](../../rules/frontend/19-release-gates.md) for what MUST pass
when. Rationale for each vendor choice is in
[`memory/frontend/package-decisions.md`](../../memory/frontend/package-decisions.md).
