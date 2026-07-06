# i18n and RTL Decisions (Frontend)

Rationale for the Twinzy frontend internationalization posture. Normative rule:
[`rules/frontend/14-i18n-rtl.md`](../../rules/frontend/14-i18n-rtl.md); library choice rationale in
[package-decisions.md](./package-decisions.md).

## Cookie-based locale over path-based locale routing

- **Decision:** the locale is stored in a cookie (`LOCALE_COOKIE_NAME = 'NEXT_LOCALE'` in
  `packages/i18n/locale.constants.ts`) and resolved per-request in `packages/i18n/request.ts`. There
  is no `/[locale]/` route segment; `ROUTE_PATHS` (`shared/constants/route-paths.constants.ts`) are
  locale-free.
- **Rejected alternative:** path-prefix routing (`/en/play`, `/ar/play`).
- **Why:** path locales double every route surface — every `AppLink`, typed route, e2e spec,
  redirect, and breadcrumb must carry the segment, and `typedRoutes` typing gets noisier for zero
  product benefit in a single-session game whose pages are ephemeral, not public marketing content
  needing per-locale SEO URLs. The cookie keeps navigation, `ROUTE_PATHS`, and Playwright specs
  single-shaped. Known trade-off, accepted: shared URLs render in the recipient's locale, not the
  sender's. If a public marketing surface is added later, that surface can adopt path locales without
  disturbing the app shell — record the change here.

## en/ar as the proof pair

- **Decision:** `SUPPORTED_LOCALES = ['en', 'ar']` with `DEFAULT_LOCALE = 'en'`; catalogs at
  `packages/i18n/messages/en.json` and `ar.json` MUST stay key-identical.
- **Why:** Arabic is the strongest stress test a second locale can provide: right-to-left direction,
  different pluralization, longer strings, and non-Latin script. If a screen works in en and ar,
  adding a third LTR locale is catalog work, not engineering work. `ar` is a real supported locale,
  not a pseudo-locale — translations are maintained, not machine-stubbed.

> Migration note: the early `apps/web` bootstrap shipped a single-locale typed dictionary. The target
> frontend OS adopts `next-intl` with the en/ar proof pair as recorded here; the typed-dictionary
> keys migrate into the catalogs.

## Direction via `dir` attribute + logical properties

- **Decision:** direction is derived from the locale by `getLocaleDirection`
  (`packages/i18n/locale.constants.ts`, RTL set = `{ar}`) and applied as the `dir` attribute on the
  document root (synced by the ui-preferences module through `setRootAttribute` in
  `packages/browser`). Styling MUST use CSS logical properties — Tailwind's `ms-*`/`me-*`/`ps-*`/
  `pe-*`/`start-*`/`end-*` utilities — never `ml-*`/`mr-*`/`left-*`/`right-*` for direction-sensitive
  spacing.
- **Rejected alternative:** RTL-specific stylesheet overrides or `rtl:` variant sprawl.
- **Why:** the `dir` attribute makes the browser do the mirroring; logical properties make every
  component correct in both directions with one class list. `rtl:` variants are reserved for the rare
  genuinely asymmetric case (e.g., an icon that must not mirror) and each use needs a comment. Visual
  specs in `apps/web/src/tests/visual/` capture both directions to catch physical-property
  regressions.

## Message keys, plurals, and the no-raw-text rule

- **Decision:** all user-visible copy comes from catalogs through `useAppTranslation` /
  `getServerTranslations`, namespaced by `I18N_NAMESPACES` (`shared/i18n/i18n-namespaces.constants.ts`).
  Raw literals in JSX are lint errors (`no-raw-i18n-text`). The single exception is
  `FALLBACK_ERROR_COPY` for `global-error`, where the i18n runtime itself may have crashed.
- **Plurals:** counts MUST use ICU plural messages, never `count === 1 ? … : …` in code. Arabic has
  six CLDR plural categories (zero, one, two, few, many, other); English's two-branch ternary is
  untranslatable into ar. The catalogs carry the categories; the code passes the number.
- **Error copy:** errors cross layers as message keys (`ERROR_MESSAGE_KEYS`,
  `shared/errors/error-keys.constants.ts`) mapped by `mapErrorToMessageKey`, and are translated only
  at the presentation edge — hooks build fully-translated view models so components stay copy-free.

## Twinzy-specific: safety wording is localized too

- **Decision:** the playful match/vibe copy (and its safety framing — Twinzy suggests public
  style/vibe matches from written traits only, never exact-lookalike, identity, or biometric claims)
  lives in the catalogs and is checked against the shared safety constants in `@twinzy/shared`
  (`packages/shared/src/constants/safety.constants.ts`). Forbidden phrasing must not appear in any
  locale catalog.
- **Why:** the safety guarantee is a product non-negotiable that must hold in both English and
  Arabic; routing all copy through catalogs plus the safety check keeps the guarantee testable rather
  than trusting per-string discipline.
