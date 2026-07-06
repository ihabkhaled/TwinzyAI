# Frontend Glossary

Repo-specific vocabulary for the Twinzy frontend (`apps/web`). Frontend rules, reviews, and this
context track use these terms with exactly these meanings. Adapted from the reference frontend OS.

**Module** — A feature directory under `apps/web/src/modules/<feature>` containing the full layer
anatomy (api, gateway, services, queries, store, containers, components, hooks, utils, helpers,
mappers, schemas, types, enums, constants, test) plus a public surface. Modules are the unit of
ownership and of cross-team isolation.

**Layer** — A named sub-directory of a module (or the top-level `app` / `shared` / `packages`
tiers) with a one-way import policy. The policy table is the `no-restricted-layer-imports` rule and
is mapped in [`context/frontend/architecture-map.md`](./architecture-map.md).

**Public surface** — A module's `index.ts`. The only file another module or `apps/web/src/app` may
import from that module (`@/modules/<feature>`). Anything not re-exported there is module-private;
reaching past it violates `no-cross-module-deep-imports`.

**Owner wrapper** — The single directory that may import a given third-party vendor, e.g.
`apps/web/src/packages/query` for `@tanstack/react-query`, or `apps/web/src/tests/msw` for `msw`.
Registered in the frontend package-boundaries ESLint config.

**Facade** — The app-named API an owner wrapper exports (`useAppQuery`, `showToast`,
`readStorageJson`). The facade is what the rest of the codebase programs against; the vendor API is
an implementation detail that can be swapped inside the wrapper.

**View model** — The fully-computed, fully-translated object a hook returns for a container to
render. Components receive view models as props and add nothing — no hooks, no logic, no raw copy.

**Wire type** — The snake_case shape of an API payload as it crosses HTTP, declared in
`modules/<f>/api/*.api.types.ts` and validated by a Zod schema in the gateway. Mappers convert wire
types to domain types; nothing above the service layer ever sees snake_case.

**BFF gateway** — The `/api/gateway/[...path]` route handler (`apps/web/src/app/api/gateway/[...path]/`,
delegating to `gateway-handler.ts`). With `SERVER_API_MOCKING=enabled` (default) it serves module
mock fixtures; otherwise it proxies to `SERVER_API_BASE_URL` (the `apps/api` backend). Client code
only ever calls same-origin paths built with `buildGatewayPath` from
`shared/api/api-routes.constants.ts`.

**Client boundary** — A file starting with `'use client'`. In this repo every client boundary MUST
carry a `// client-boundary-reason: …` comment (enforced by `require-client-component-reason`), and
boundaries are pushed down to containers, never hoisted to layouts.

**Message key** — A dot-path identifier for user-visible copy (e.g. `MATCH_MESSAGE_KEYS.success`)
resolved against the catalogs in `packages/i18n/messages/{en,ar}.json`. Raw literal copy in JSX or
schemas violates `no-raw-i18n-text`; the sole exception is `FALLBACK_ERROR_COPY` used by
`app/global-error.tsx`. Twinzy safety wording (no exact-lookalike / identity / biometric claims)
lives in catalogs and is checked against the shared safety constants.

**Query key builder** — The one file per module allowed to construct TanStack Query cache keys.
Inline key arrays anywhere else violate `no-inline-query-keys`.

**Enum-like object** — An `as const` object plus derived union type (e.g. `AppTheme`,
`AppDirection`) used instead of TypeScript `enum`, keeping erasable syntax and exact string values.
The `enum` keyword is banned repo-wide (a Twinzy product non-negotiable, stricter than the generic
rule).

**Gate** — An automated pass/fail check a change MUST clear: lint (`--max-warnings=0`), typecheck
(tsgo), coverage thresholds, build, e2e/a11y/visual suites, `security:audit`, `security:scan`,
knip (dead code), madge (circular deps). The frontend release-gate policy is
[`rules/frontend/19-release-gates.md`](../../rules/frontend/19-release-gates.md).

**Exception** — A documented, reviewed, time-boxed deviation from a rule (e.g. an `eslint-disable`).
Every exception needs a written record; undocumented disables fail review. See
[`rules/frontend/10-eslint-typescript.md`](../../rules/frontend/10-eslint-typescript.md).

**Container** — A `*.container.tsx` client component that connects hooks to JSX-only components and
performs the `.map()` over child elements. See
[`rules/frontend/02-components-and-containers.md`](../../rules/frontend/02-components-and-containers.md).

**Workbench** — The `/workbench` route (`app/(workbench)/workbench/page.tsx`), the living showcase
of design-system primitives adopted instead of Storybook; it runs inside the real app shell so the
visual and accessibility Playwright specs can sweep it.

**BFF mock mode** — `SERVER_API_MOCKING=enabled`: the gateway serves each module's `api/*.mock.ts`
fixtures instead of proxying to `apps/api`, so the whole frontend runs, tests, and e2e's with zero
backend. MSW is the same-vocabulary fake at the Vitest level.

Governance vocabulary (request classification, phases 00–27, artifacts, hard gates) is defined once
in the root [`CLAUDE.md`](../../CLAUDE.md) and applies to both tracks.
