# Skill: Fix ESLint and Typecheck Failures (Frontend)

Lint runs with `--max-warnings=0` and typecheck runs `tsgo` (with `tsc` as the cross-check), so
"mostly green" does not exist. The prime directive: **fix violations by moving code to the layer the
rule points at — never by disabling the rule.** An `eslint-disable` without a documented, approved
waiver is itself a lint failure.

> The backend variant is [fix-eslint-typecheck.md](./fix-eslint-typecheck.md). This one covers the
> `frontend-architecture` rules for `apps/web`; the rule overview is
> [docs/eslint-architecture.md](../docs/eslint-architecture.md).

## Triage protocol (ESLint)

1. Run `npm run lint` and group failures by rule id.
2. For every `frontend-architecture/*` (or `architecture/*`) rule, read its intent in
   [docs/eslint-architecture.md](../docs/eslint-architecture.md) first; the rule message in
   [eslint/architecture.config.mjs](../eslint/architecture.config.mjs) states the layer contract
   being broken.
3. Apply the resolution from the table below. If the fix means relocating code, follow
   [skills/refactor-feature.md](./refactor-feature.md) (tests first, one layer at a time).
4. Re-run `npm run lint`. Use `npm run lint:fix` only for mechanical fixers (import order, unused
   imports) — never expect it to fix architecture rules.

| Violation                                              | Resolution                                                                                                                                                     |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no-hooks-in-components` / `tsx-pure-composition`      | Move the hook call into the container (`*.container.tsx`) or a module hook; pass computed props down.                                                          |
| `no-inline-declarations` / `no-inline-component-logic` | Extract to `utils/`, `helpers/`, a `*.variants.ts` file, or the container. Components stay JSX-only.                                                          |
| `no-restricted-layer-imports`                          | You imported against the one-way policy table. Invert the dependency: services never import hooks; move the shared piece down a layer.                        |
| `no-raw-package-imports` / `no-raw-library-imports`    | Import the owner facade instead (e.g. `@/packages/query`, not `@tanstack/react-query`). Missing owner? [skills/create-package-wrapper.md](./create-package-wrapper.md). |
| `no-cross-module-deep-imports`                         | Import from `@/modules/<feature>` and export the symbol from that module's `index.ts` if it is genuinely public.                                              |
| `no-direct-env-access` / `no-process-env`              | Read via `publicEnv` / `getServerEnv` from `@/packages/env`; add new vars there and to `.env.example`.                                                        |
| `no-direct-browser-api-outside-packages`               | Use the facade in `@/packages/browser` (`getSafeWindow`, `matchesMediaQuery`, …) or `@/packages/storage`.                                                     |
| `no-inline-query-keys`                                 | Add the key to the module's builder (e.g. `gameQueryKeys` in `apps/web/src/modules/game/queries/game-query-keys.ts`) and use it everywhere.                   |
| `no-raw-i18n-text`                                     | Add a message key ([skills/add-i18n-message-key.md](./add-i18n-message-key.md)) to `apps/web/src/packages/i18n/messages/{en,ar}.json` and translate via `useAppTranslation`. |
| `no-inline-classname-outside-design-system`            | Move class bundles to a `*.variants.ts` file or use a primitive from `@/packages/ui-primitives`.                                                              |
| `require-client-component-reason`                      | Add `// client-boundary-reason: …` — or better, question whether the file needs `'use client'` at all.                                                        |
| `no-server-only-import-in-client`                      | Keep server env/i18n (`@/packages/env/server`, `getServerTranslations`) in server files; pass data down as props.                                             |

## Triage protocol (typecheck)

1. Run `npm run typecheck` (tsgo, `tsc --noEmit` for `apps/web`). Note which workspace/project
   failed; that tells you whether the error is app code, test code, or tooling config.
2. If a tsgo message looks wrong or truncated, cross-check with the stock compiler
   (`tsc --noEmit`). Same error in both means the code is wrong.
3. Fix causes, not symptoms: no `any`, no `as` casts to silence a mismatch, no `!` assertions.
   Typical real fixes: narrow with `isDefined`, exhaust unions with `assertNever`, parse unknown
   data with `parseSchema`/`safeParseSchema` from `@/packages/zod` instead of asserting a shape, and
   let mappers own wire→domain conversion. (The TS `enum` keyword is banned — use `as const`.)
4. Errors in route files about href strings usually mean typedRoutes rejected a path — use
   `ROUTE_PATHS` (`apps/web/src/shared/constants/route-paths.constants.ts`) with `AppLink`.

## When an exception is genuinely needed

Rare, and never for architecture rules in feature code. If a rule is truly wrong for a specific line
(e.g. a vendor type hole inside a package wrapper):

1. Record the waiver (rationale, scope, owner, expiry) and get it approved per the governance in the
   root `CLAUDE.md` and [rules/frontend/00-non-negotiable-rules.md](../rules/frontend/00-non-negotiable-rules.md).
2. Only then add the narrowest possible `// eslint-disable-next-line <rule> -- <approved-waiver-ref>`.
3. Undocumented disables are rejected in review per
   [rules/frontend/20-review-checklist.md](../rules/frontend/20-review-checklist.md).

## Done when

`npm run lint` and `npm run typecheck` both exit 0 with no new disables, or every remaining disable
points at an approved waiver.

## Validation (gate)

```bash
npm run lint                # ESLint flat config — 0 errors, 0 warnings, no undocumented disables
npm run typecheck           # tsgo, strict — no `any`/casts/`!` to silence errors
npm run test:coverage       # Vitest — behavior still covered
npm run build               # next build
npm run quality:dead-code   # knip
npm run quality:circular    # madge
```
