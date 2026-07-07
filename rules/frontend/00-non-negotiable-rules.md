# 00 — Non-Negotiable Rules

These 21 rules are the contract of the `apps/web` frontend. They are never waived in review, never
"cleaned up later", and never bypassed with an `eslint-disable`. Inline ESLint suppression is
forbidden with no exceptions — `eslint-disable`, `eslint-disable-line`, `eslint-disable-next-line`,
and `eslint-enable` are banned anywhere, for any reason, and no [docs/exceptions/](../../docs/exceptions/)
entry can authorize one. Each entry states why it exists and what enforces it.
They sit under the shared SDLC governance in [CLAUDE.md](../../CLAUDE.md); where a rule here and a
Twinzy product non-negotiable overlap, the stricter one wins.

1. **The architecture map is the source of truth.** `apps/web/src/app` holds routes only,
   `apps/web/src/modules/<feature>` holds features, `apps/web/src/shared` holds generic building
   blocks, `apps/web/src/packages/<vendor>` holds library wrappers. Code in the wrong place rots the
   whole system because every other rule assumes this layout. Enforced by: `no-restricted-layer-imports`
   driven by the policy table in [eslint/architecture.config.mjs](../../eslint/architecture.config.mjs),
   plus review against [context/frontend/architecture-map.md](../../context/frontend/architecture-map.md).

2. **Components are JSX-only.** `*.component.tsx` files render pre-computed props and nothing else,
   so they are trivially testable, reusable, and safe to restyle. Enforced by:
   `no-inline-component-logic`, `no-hooks-in-components`, `no-raw-i18n-text`,
   `no-inline-classname-outside-design-system`.

3. **No hooks in components.** Hooks in presentational files smuggle behavior into the view and make
   the component untestable without providers. Behavior belongs in `hooks/` and `containers/`.
   Enforced by: `no-hooks-in-components` ([docs/eslint/no-hooks-in-components.md](../../docs/eslint/no-hooks-in-components.md)).

4. **No inline declarations.** Objects, arrays, functions, and config literals declared inside JSX or
   component bodies create unstable references and hide reusable values. Declare them in constants,
   variants, or helper files. The same rule also bans module-level types, interfaces, enums, and
   non-function consts sitting inline in any layer file (component, container, hook, service, gateway,
   query, route): types, interfaces, and enums live in `types/` (or `model/`, `enums/`), and reusable
   value/config consts and `as const` maps live in `constants/` (or `model/`) — the sole exception being
   `*.variants.ts` design-system class bundles. Enforced by: `no-inline-declarations`.

5. **No TypeScript `enum` keyword.** `enum` emits runtime code, breaks `isolatedModules` patterns, and
   erases values under `verbatimModuleSyntax`. Use the `as const` object + derived type pattern shown in
   `apps/web/src/shared/enums/app-theme.enum.ts`. This mirrors the repo-wide Twinzy product
   non-negotiable in [CLAUDE.md](../../CLAUDE.md). Enforced by: ESLint restricted-syntax in
   [eslint/typescript.config.mjs](../../eslint/typescript.config.mjs) and review.

6. **No magic strings.** Routes, storage keys, test ids, endpoints, message keys, and namespaces come
   from the catalogs in `apps/web/src/shared/constants/`, `apps/web/src/shared/errors/`, and module
   `constants/` folders. A string literal repeated twice is already a bug vector. Enforced by:
   `no-inline-query-keys`, `no-raw-i18n-text`, and the review checklist in
   [20-review-checklist.md](20-review-checklist.md).

7. **No raw package imports outside wrappers.** Every third-party package has exactly one owner under
   `apps/web/src/packages/` so upgrades, error normalization, and API discipline live in one file.
   Enforced by: `no-raw-package-imports` with the ownership map in
   [eslint/package-boundaries.config.mjs](../../eslint/package-boundaries.config.mjs).

8. **No cross-module deep imports.** Modules talk to each other only through `@/modules/<feature>`
   (the `index.ts` public surface); reaching into another module's internals couples features
   irreversibly. Enforced by: `no-cross-module-deep-imports`.

9. **No server data in Zustand.** Server state lives in the TanStack Query cache where it gets caching,
   invalidation, and refetching for free; duplicating it in a store guarantees staleness bugs.
   Enforced by: the `module-store` policy in [eslint/architecture.config.mjs](../../eslint/architecture.config.mjs)
   and review per [06-zustand.md](06-zustand.md).

10. **No direct browser APIs outside wrappers.** `window`, `document`, `localStorage`, and
    `matchMedia` crash on the server and scatter feature detection. Use `apps/web/src/packages/browser`
    and `apps/web/src/packages/storage`. Enforced by: `no-direct-browser-api-outside-packages`.

11. **No raw `process.env` outside env/config.** Unvalidated env reads fail silently at runtime.
    All env access goes through `publicEnv` / `getServerEnv` in `apps/web/src/packages/env`, both
    Zod-validated. Enforced by: `no-process-env-outside-config`.

12. **No raw user-facing copy — i18n keys only.** Hardcoded strings are invisible to translators and
    break the `ar` locale. Copy comes from `apps/web/src/packages/i18n/messages/{en,ar}.json` via
    translation keys; the single exception is `FALLBACK_ERROR_COPY` for `global-error.tsx`. Enforced
    by: `no-raw-i18n-text`.

13. **No raw `className` outside the design system.** Tailwind class soup in feature code makes theming
    and RTL audits impossible. Class bundles live in `*.variants.ts` files and
    `apps/web/src/packages/ui-primitives`. Enforced by: `no-inline-classname-outside-design-system`.

14. **No `any`, non-null assertions, `@ts-ignore`, or inline ESLint suppression.** Each of these deletes
    the type system or silences the linter exactly where it was about to help. Inline ESLint suppression
    is forbidden with no exceptions: never write `eslint-disable`, `eslint-disable-line`,
    `eslint-disable-next-line`, or `eslint-enable` — anywhere, for any reason; no
    [docs/exceptions/](../../docs/exceptions/) entry can authorize one. A rule firing means the code is
    wrong or in the wrong layer: fix the root cause or move the code, never silence the linter. Enforced
    by: strict flags in [apps/web/tsconfig.json](../../apps/web/tsconfig.json) (extending
    [tsconfig.base.json](../../tsconfig.base.json)), typed-lint rules in
    [eslint/typescript.config.mjs](../../eslint/typescript.config.mjs), `eslint-comments/no-use: error`
    plus `reportUnusedDisableDirectives: error` in
    [eslint/eslint-comments.config.mjs](../../eslint/eslint-comments.config.mjs), and lint's
    zero-warnings policy.

15. **Query keys come from builders only.** Inline key arrays drift from the invalidation code and
    silently stop matching. Keys come from builder files such as
    `apps/web/src/modules/articles/queries/article-query-keys.ts`. Enforced by: `no-inline-query-keys`.

16. **API endpoints are constants only.** URL strings assembled ad hoc dodge the BFF gateway and break
    when the backend moves. Paths come from `API_ROUTES` + `buildGatewayPath`
    (`apps/web/src/shared/api/api-routes.constants.ts`) and module endpoint constants. Enforced by:
    review + gateway-layer ownership of `httpClient` calls.

17. **Errors surface as sanitized message keys.** Raw error messages can leak internals and are
    untranslatable. Errors normalize through `toAppError` and map to `ERROR_MESSAGE_KEYS` via
    `apps/web/src/shared/errors/http-error-to-message-key.mapper.ts`. Enforced by: `HttpError`
    normalization in `apps/web/src/packages/axios` and review per [18-error-handling.md](18-error-handling.md).

18. **Security headers and env validation are mandatory.** The nonce CSP in
    `apps/web/src/proxy.ts`, the static headers in [apps/web/next.config.ts](../../apps/web/next.config.ts),
    and Zod-validated env are baseline, not features. Removing any of them is a security regression.
    Enforced by: `npm run security:scan` (Trivy), `npm run audit`, and [11-security.md](11-security.md).

19. **TDD is required for behavior changes.** A behavior change without a failing test first is a
    change nobody can safely refactor later. Write the test, watch it fail, make it pass.
    Enforced by: coverage thresholds in [vitest.config.ts](../../vitest.config.ts) (95% global, 100%
    for utils/helpers/mappers/schemas/query-key builders) and review per
    [testing/frontend/testing-strategy.md](../../testing/frontend/testing-strategy.md).

20. **All gates pass before handoff.** `npm run validate` (lint, typecheck, tests with coverage,
    build) plus the security scripts must be green before a PR is opened — CI is a verifier, not a
    debugger. Enforced by: [.husky/pre-commit](../../.husky/), [.husky/pre-push](../../.husky/), and
    CI per [19-release-gates.md](19-release-gates.md).

21. **Components split into small chunks.** A `*.component.tsx` or `*.container.tsx` that keeps growing
    becomes a god-component nobody can review, test, or reuse; split it into sub-components and
    sub-containers before it forms. A `.component.tsx` stays pure JSX — it may not call hooks or hold
    logic, `.map()`, or inline handlers; a view that must map lists or hold body vars is a container
    (e.g. `game-result.container`, `game-processing.container`). Enforced by: `max-lines` (130),
    `max-lines-per-function` (60), and `react/jsx-max-depth` in
    [eslint/frontend/component-size.config.mjs](../../eslint/frontend/component-size.config.mjs) —
    tighter than the repo-wide 300/80 base — plus `no-hooks-in-components` and
    `no-inline-component-logic`.
