# Skill: Create a Package Wrapper

Use this skill when the team approves a new third-party dependency for the web app. Every vendor
gets exactly one owning wrapper under `apps/web/src/packages/<capability>/` — app code never imports
the raw package. The rule that enforces this is `no-raw-package-imports` (doctrine:
[rules/frontend/09-library-wrapping.md](../rules/frontend/09-library-wrapping.md); enforcement
overview in [docs/eslint-architecture.md](../docs/eslint-architecture.md)).

## Read first

- [rules/frontend/09-library-wrapping.md](../rules/frontend/09-library-wrapping.md)
- [memory/library-boundaries.md](../memory/library-boundaries.md)
- [docs/package-decisions.md](../docs/package-decisions.md)

## Steps

1. **Record the decision first.** Add an entry to
   [docs/package-decisions.md](../docs/package-decisions.md): what the package does, why the
   existing wrappers cannot cover it, and what the facade will expose.
2. **Install the package** with an exact-range-friendly npm install, then run
   `npm run audit` and `npm run security:scan`. A new dependency that introduces an unhandled
   vulnerability MUST NOT land; fix it via an `overrides` entry in `package.json` (the `multer`
   override there is the reference example) or pick another package.
3. **Create the owner directory** `apps/web/src/packages/<name>/` where `<name>` describes the
   capability, not the vendor: dates live in `apps/web/src/packages/date/`, sonner in
   `apps/web/src/packages/toast/`, react-virtuoso in `apps/web/src/packages/virtuoso/`. This keeps a
   future vendor swap invisible to app code. The established owners are:

   | Vendor                              | Owner (`apps/web/src/packages/`) | Public surface                        |
   | ----------------------------------- | -------------------------------- | ------------------------------------- |
   | axios                               | `axios`                          | `httpClient`                          |
   | @tanstack/react-query               | `query`                          | `useAppQuery`, `useAppMutation`, ...  |
   | zustand                             | `zustand`                        | `createAppStore`, `useAppStoreShallow`|
   | zod                                 | `zod`                            | `z`, `parseSchema`                    |
   | react-hook-form                     | `forms`                          | `useAppZodForm`                       |
   | next-intl                           | `i18n`                           | `useAppTranslation`, `getServerTranslations` |
   | sonner                              | `toast`                          | `showToast`                           |
   | lucide-react                        | `icons`                          | named `*Icon` exports                 |
   | cva / clsx / tailwind-merge         | `ui-primitives`                  | `cn`, `Button`, `buttonVariants`, ... |
   | react-virtuoso                      | `virtuoso`                       | `VirtualizedList`                     |
   | next/link                           | `link`                           | `AppLink`, `ExternalLink`             |
   | next/navigation                     | `navigation`                     | `useAppRouter`, ...                   |

4. **Design the facade, not a re-export.** The wrapper MUST expose app-shaped functions and
   components with our naming (`showToast`, `formatDisplayDate`, `VirtualizedList`) and MUST
   hide vendor option objects behind narrow prop/param types. Rules:
   - `index.ts` is the only public surface; export named symbols and their types.
   - Client-only wrappers start with `'use client'` plus a
     `// client-boundary-reason: …` comment.
   - Never leak vendor types through the facade signature unless the type is the product
     (as with `z` from `@/packages/zod`).
5. **Register the boundary.** Add one line to the boundary list in
   [eslint/package-boundaries.config.mjs](../eslint/package-boundaries.config.mjs):

   ```js
   { forbid: ['^some-vendor$'], allowIn: ['/apps/web/src/packages/<name>/'], message: '…' },
   ```

   For Next.js built-in module specifiers (`next/link`, `next/navigation`) match the subpath form.
   From this moment, importing the vendor anywhere else fails `npm run lint` (which runs with
   `--max-warnings=0`).
6. **Update the human-readable twin.** [memory/library-boundaries.md](../memory/library-boundaries.md)
   moves in lockstep with `eslint/package-boundaries.config.mjs`. Add the vendor, wrapper path, and
   key exports there in the same change.
7. **Write unit tests** colocated per the testing standard
   ([skills/write-unit-tests-frontend.md](./write-unit-tests-frontend.md)). Wrappers under
   `apps/web/src/packages/**` are inside the 95% coverage gate; pure helper logic inside the wrapper
   MUST hit 100%. Test the facade contract (inputs → outputs, error normalization), never vendor
   internals.
8. **Verify the fence.** Temporarily import the raw vendor from a module file and confirm
   `npm run lint` fails with the boundary rule, then revert. Finish with `npm run quality:circular`
   and `npm run quality:dead-code` (knip flags unused facade exports — export only what callers need
   today).

## Validation (gate)

```bash
npm run lint                # boundary rule fails on any raw vendor import
npm run typecheck           # tsgo, strict
npm run test:coverage       # Vitest — 95% global, 100% pure wrapper logic
npm run build               # next build
npm run quality:dead-code   # knip — no unused facade exports
npm run quality:circular    # madge — no import cycles
npm run test:e2e            # relevant Playwright suite (if the wrapper is used in a flow)
```

## Definition of done

- Wrapper directory with `index.ts` public surface and tests.
- Boundary line in [eslint/package-boundaries.config.mjs](../eslint/package-boundaries.config.mjs)
  and matching row in [memory/library-boundaries.md](../memory/library-boundaries.md).
- Decision recorded in [docs/package-decisions.md](../docs/package-decisions.md).
- The full gate above is green.
