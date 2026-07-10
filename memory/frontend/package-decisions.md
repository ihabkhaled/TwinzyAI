# Package Decisions (Frontend)

Every third-party package below is owned by exactly one wrapper under `apps/web/src/packages/`
(policy: [`rules/frontend/09-library-wrapping.md`](../../rules/frontend/09-library-wrapping.md),
ownership map: [`context/frontend/package-boundaries.md`](../../context/frontend/package-boundaries.md)).
This file records **why each package won** over its alternatives. Propose a replacement only with a
new dated entry here. Adapted from the reference frontend OS.

> Current decision (2026-07-10): `dayjs`, `react-hook-form`, `@hookform/resolvers`,
> `react-virtuoso`, and MSW were removed as unused. Their historical sections below are superseded;
> do not recreate wrappers without a present measured requirement and a new approval record.

## dayjs over date-fns (and Luxon)

- **Decision:** `dayjs`, wrapped at `packages/date` (`formatDisplayDate`, `formatDisplayDateTime`,
  `formatRelativeToNow`, `toIsoString`, `isValidDate`).
- **Why:** tiny immutable core with opt-in plugins; the wrapper exposes five verbs, so the
  tree-shaking ergonomics of date-fns buy nothing once imports are funneled through one file. Luxon's
  Intl strength is unused because display formatting already routes through the locale-aware wrapper.
  If dayjs is ever swapped, only `packages/date` changes.

## next-intl over react-i18next

- **Decision:** `next-intl`, wrapped at `packages/i18n` (`useAppTranslation`, `getServerTranslations`,
  `AppIntlProvider`, catalogs in `packages/i18n/messages/`).
- **Why:** first-class App Router support — server components translate via `getServerTranslations`
  without shipping catalogs to the client, and the cookie-based locale (`LOCALE_COOKIE_NAME =
  'NEXT_LOCALE'`) integrates with `packages/i18n/request.ts`. react-i18next is client-centric and
  would force provider gymnastics in server components. Full rationale:
  [i18n-rtl-decisions.md](./i18n-rtl-decisions.md). Supersedes the early single-locale typed
  dictionary used during the `apps/web` bootstrap.

## sonner over react-hot-toast

- **Decision:** `sonner`, wrapped at `packages/toast` (`showToast`, `ToastType`, `AppToaster`).
- **Why:** accessible by default (polite live regions, keyboard dismissal), works as a single mounted
  `AppToaster`, and has a minimal imperative API that maps cleanly onto our typed `showToast` facade.
  react-hot-toast's styling model invites inline classNames, which the design-system rule forbids
  outside `packages/ui-primitives`.

## react-virtuoso over react-window / react-virtualized

- **Decision:** `react-virtuoso`, wrapped at `packages/virtuoso` (`VirtualizedList`).
- **Why:** automatic dynamic row measurement — no `itemSize` bookkeeping, which is where react-window
  integrations rot. The wrapper requires `computeItemKey` and a fixed `heightPx`, keeping the surface
  narrow under `exactOptionalPropertyTypes`. Threshold for using it:
  [performance-decisions.md](./performance-decisions.md).

## axios over raw fetch

- **Decision:** `axios`, wrapped at `packages/axios` (`httpClient`, `createHttpClient`, `HttpError`,
  `isHttpError`, `normalizeToHttpError`).
- **Why:** interceptors give one choke point to normalize every transport failure into `HttpError`
  before it reaches services; raw fetch requires hand-rolling status handling, JSON parsing, timeouts,
  and error shaping at every call site. Since all client traffic goes to the same-origin BFF gateway
  via `buildGatewayPath`, fetch's edge-runtime advantages are irrelevant here.

## cva + clsx + tailwind-merge trio

- **Decision:** `class-variance-authority` for variant tables, `clsx` for conditional composition,
  `tailwind-merge` for conflict resolution — fused into one `cn` helper and the primitives in
  `packages/ui-primitives`.
- **Why:** cva makes variants declarative data (`buttonVariants`, `alertVariants`, `stackVariants`);
  tailwind-merge guarantees the last conflicting utility wins so primitives can accept a `className`
  escape hatch safely. No component outside the design system composes raw class strings (rule:
  `no-inline-classname-outside-design-system`).

## No Radix yet — native-first primitives

- **Decision:** no headless-UI dependency. Primitives (`Button`, `Input`, `Label`, `Card`, `Alert`,
  `Spinner`, `Skeleton`, `Stack`, `PageContainer`) are native elements styled with tokens.
- **Why:** everything currently shipped is achievable with semantic HTML plus the jsx-a11y strict
  preset; a headless library adds a dependency surface before any overlay/popover need exists. When a
  composite widget (dialog, combobox, menu) is genuinely needed, Radix is the pre-approved candidate
  and gets its own wrapper under `packages/` — record the adoption here first.

## @twinzy/shared for cross-side contracts

- **Decision:** cross-side constants, enums (as-const), schemas, and types — including the safety
  wording constants — live in the workspace package `@twinzy/shared` (`packages/shared`) and are
  imported directly by both `apps/web` and `apps/api`.
- **Why:** wire contracts and the safety guarantee must stay identical on both sides; a shared package
  is the single source of truth and prevents drift. Frontend-only concerns (browser, storage, toast,
  etc.) still get a `packages/` wrapper — `@twinzy/shared` is for genuinely cross-side shapes only.

## npm over pnpm / yarn

- **Decision:** npm workspaces (`engines.npm >= 10`), one lockfile for `apps/api`, `apps/web`,
  `packages/shared`.
- **Why:** zero-install tooling on every Node >= 22 machine and CI image; `overrides` handles the
  transitive-vulnerability workflow we actually use (see the postcss case in
  [known-pitfalls.md](./known-pitfalls.md)); native workspace support links `@twinzy/shared` without a
  second tool. pnpm's strictness benefits are already delivered by knip, `no-raw-package-imports`, and
  the lockfile-committed policy.
