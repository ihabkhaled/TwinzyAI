# Known Pitfalls (Frontend)

> Historical migration log. Current facts live in
> [`context/stack-and-toolchain.md`](../../context/stack-and-toolchain.md) and root
> [`memory/known-pitfalls.md`](../known-pitfalls.md): ESLint 10 is active, typechecks use workspace
> `tsc`, and MSW is not installed. Do not apply superseded version pins below.

Failures actually hit building strict Next.js 16 frontends on this stack, with their fixes. Consult
this file before debugging toolchain, typing, or lint errors — most of them are already solved here.
Adapted from the reference frontend OS for Twinzy (`apps/web`).

## Toolchain and dependency pinning

### ESLint 10 breaks the plugin ecosystem

- **Symptom:** upgrading to ESLint 10 makes `eslint-plugin-jsx-a11y` and `eslint-plugin-unicorn`
  fail to load under the flat-config API.
- **Fix:** stay on the ESLint 9 line (`eslint: ^9.39.4`) until both plugins publish
  ESLint-10-compatible releases. Do not let `npm run deps:upgrade` cross this major without
  re-verifying `npm run lint` on the full tree.

### TypeScript 6 breaks madge and typescript-eslint peer ranges

- **Symptom:** TypeScript 6 falls outside the peer ranges of `madge` (circular-dependency gate) and
  `typescript-eslint`, breaking `npm run quality:circular` and lint.
- **Fix:** stay on the 5.9 line (`typescript: ^5.9.3`). Day-to-day typechecking runs through tsgo
  (`@typescript/native-preview`, `npm run typecheck`); `npm run typecheck:tsc` (`tsc --noEmit`) is
  the fallback and both must stay green.

### npm `overrides` must mirror the direct devDependency exactly

- **Symptom:** an `overrides` entry whose spec string differs from the direct devDependency makes
  `npm install` error or silently keep the vulnerable transitive version.
- **Fix:** use the identical spec in both places (e.g. `"overrides": { "postcss": "^8.5.16" }` and
  `"postcss": "^8.5.16"` in devDependencies), then regenerate the lockfile with a fresh `npm install`.
  Rationale in [security-decisions.md](./security-decisions.md).

### knip is pinned to the 5.x line

- **Symptom:** knip 6 hard-requires the `oxc-parser` native module, which Windows Application Control
  policies can block (`ERR_DLOPEN_FAILED` / "An Application Control policy has blocked this file").
- **Fix:** stay on knip 5 — it parses with TypeScript and needs no native binding. Revisit when the
  oxc binary ships signed. (Relevant because this repo is developed on Windows.)

### npm sometimes drops platform-specific optional deps

- **Symptom:** `Cannot find module './*.node'` after a lockfile regeneration (the well-known npm
  optional-dependencies bug).
- **Fix:** a fresh `npm ci` locally; never commit a platform binding to `package.json`.

## Lint rules vs SSR reality

### `unicorn/prefer-global-this` breaks SSR-safe browser detection

- **Symptom:** the rule rewrites `typeof window !== 'undefined'` to `globalThis`-based code, and
  `lib.dom` types `window` as always present — the naive check then typechecks as always-true and the
  SSR guard evaporates.
- **Fix:** encode detection once through an untyped global read in the browser facade:
  `(globalThis as Record<string, unknown>)['window']` inside `packages/browser` (`isBrowser`,
  `getSafeWindow`). All other code MUST use the facade, never raw globals (enforced by
  `no-direct-browser-api-outside-packages`).

### sonarjs `no-hardcoded-passwords` false-positives

- **Symptom:** i18n keys, test ids, and form field ids containing the word "password" are flagged as
  hardcoded credentials.
- **Fix:** turn the rule off in the sonar ESLint config with an inline justification comment. Secret
  detection is owned by Trivy (`npm run security:scan`), which scans actual secret patterns.

## React 19 / TypeScript strictness

### React 19 types deprecate `FormEvent` / `FormEventHandler`

- **Fix:** type form submit handlers as `SyntheticEvent<HTMLFormElement>` instead. Keep the handler
  type on the module's `*.types.ts`, consumed by the form component.

### TanStack `useMutation` generic order

- **Pitfall:** the order is `<TData, TError, TVariables>` — putting variables second compiles in loose
  codebases and explodes here. The wrapper `useAppMutation` in `packages/query` fixes the order once;
  use it, never the raw hook.

### `exactOptionalPropertyTypes` and computed `undefined`

- **Symptom:** view-model fields assigned a computed value that may be `undefined` fail against
  `prop?: T`; vendor prop spreads fail because vendor types were not written for this flag.
- **Fix:** declare such fields as `prop?: T | undefined` on view-model types, and keep wrapper prop
  surfaces narrow (explicit props, no blind `...rest` spreads into vendor components) — see
  `packages/virtuoso` for the pattern.

### `zodResolver` cannot type-flow through generic schemas

- **Symptom:** under `exactOptionalPropertyTypes`, `zodResolver` cannot carry an abstract
  `TFieldValues` through its overloads.
- **Fix:** one documented double-cast inside `packages/forms/use-app-zod-form.hook.ts` — the single
  sanctioned bridge. Never repeat this cast in feature code.

## Next.js 16 conventions

- **`middleware.ts` is now `proxy.ts`:** the per-request nonce CSP lives in `apps/web/src/proxy.ts`.
  Creating a `middleware.ts` does nothing in Next 16.
- **`next dev`/`next build` rewrite `tsconfig`:** Next forces `"jsx": "react-jsx"` and appends `.next`
  dev type files to `include`. This is expected — do not fight the rewrite, and do not commit
  unrelated tsconfig churn as if it were a regression. Project-reference splits live in
  `tsconfig.app.json` / `tsconfig.test.json` / `tsconfig.node.json`.
- **Turbopack vs webpack builds:** this repo's `apps/web` scripts default to `--webpack` for
  deterministic Docker builds, with `dev:turbo` / `build:turbo` as the Turbopack variants. Pick one
  per environment and keep it stable; do not mix build engines within a release.

## TanStack Query / Zustand state boundaries

- **Server data never goes in Zustand.** The query cache owns server state (dedupe, retries,
  invalidation); Zustand holds only client-global UI state (theme, direction, sidebar). Mixing them
  produces two sources of truth and stale reads. Enforced by the `module-store` layer policy.
- **Zustand SSR hydration flash:** reading a persisted store value during the server render produces
  a hydration mismatch. Keep the store pure and default-valued; do hydration/persistence/DOM-sync in
  an effects hook via the `storage` and `browser` facades, gating render on a `hasHydrated` flag.
- **RHF `formState` is a lazy proxy:** read `formState.errors` during render (inside the hook under
  test) or subscriptions never fire and assertions see stale state.

## Layer file discipline (lint-enforced)

- **No inline types/consts in layer files.** Reusable declarations must live in dedicated files, never
  inline in logic/presentation files: types/interfaces/enums → `types/` (or `model/`, `enums/`);
  reusable value/config consts and `as const` maps → `constants/` (or `model/`). Enforced by
  `frontend-architecture/no-inline-declarations`, which bans module-level types/interfaces/enums and
  non-function consts in component/container/hook/service/gateway/query/route files. The one approved
  home for class strings is `*.variants.ts` design-system bundles. (Backend has the parallel
  `architecture/no-inline-domain-definitions`, which also bans module-level value/config consts in
  `apps/api` layer files.)
- **Split components before a god-component forms.** `*.component.tsx` / `*.container.tsx` are capped
  tighter than the repo-wide 300/80 base — `max-lines` 130, `max-lines-per-function` 60, plus
  `react/jsx-max-depth` (via `eslint/frontend/component-size.config.mjs`). A `.component.tsx` is pure
  JSX: it may not call hooks (`no-hooks-in-components`) nor hold logic/`.map()`/inline handlers
  (`no-inline-component-logic`). When a view must map lists or hold body vars it becomes a CONTAINER
  (e.g. `game-result.container`, `game-processing.container`), which may map.

## MSW / test-runner pitfalls

- **`vi.mock('next/navigation')` / `vi.mock('sonner')` do not intercept externalized vendor modules.**
  Provide Next's `AppRouterContext` / `PathnameContext` directly through a router stub in
  `apps/web/src/tests/helpers/`, and assert real toast DOM output instead of mocking the vendor.
- **MSW is the only HTTP fake.** Do not `vi.mock` the axios wrapper — that quietly exempts
  `normalizeToHttpError`, mappers, and `buildGatewayPath`, the layers most likely to break on contract
  drift. Handlers live in `apps/web/src/tests/msw/handlers/`.
- **Playwright must not use port 3000:** `reuseExistingServer` will happily attach to a developer's
  unrelated dev server on 3000 and every assertion fails against the wrong app. The e2e server runs on
  the dedicated port 3100 (`dev:e2e`, `playwright.config.ts`).
- **Lint autofixers can change test semantics:** `unicorn/prefer-https` rewrote a deliberate `http://`
  rejection-test URL to `https://`, and `unicorn/no-useless-undefined` stripped a required
  `vi.stubGlobal('window', undefined)` argument. Build attack/edge-case strings dynamically
  (`['http', '//x'].join(':')`) and keep `checkArguments: false` configured.

## Tailwind v4 conventions

- **Tokens are CSS-first, not JS-config.** Tailwind v4 config lives in `src/app/styles.css` via
  `@theme inline` mapping `--role-*` runtime variables to `--color-*` tokens. There is no
  `tailwind.config.js` palette to edit — hardcoding palette values in `@theme` inlines them and breaks
  runtime `[data-theme='dark']` switching.
- **Dark mode is `data-theme`, not the `dark:` variant everywhere.** The custom variant is declared
  once: `@custom-variant dark (&:where([data-theme='dark'], [data-theme='dark'] *))`; do not sprinkle
  `dark:` on every class. Theme flips by toggling the root attribute — no re-render, no flash.

## Twinzy product traps

- **Never persist or log uploaded images on the client.** The upload flow holds the image in memory
  only and releases it (revoke any object URL) as soon as the request resolves. Never write it to
  storage, never send it to the logger, never keep it in a Zustand store. Only the backend's
  trait-extraction step sees the image; the client sends it once and forgets it.
- **No monetization UI, ever.** The game is free — do not add payment, subscription, paywall, or
  upsell components. A "premium" prop or route is a product-constraint violation, not a feature.
