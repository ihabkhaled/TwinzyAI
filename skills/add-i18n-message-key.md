# Skill: Add an i18n Message Key

Use this skill whenever user-visible copy is added or changed. Raw literal text in JSX is an
ESLint violation (`no-raw-i18n-text`); doctrine is
[rules/frontend/14-i18n-rtl.md](../rules/frontend/14-i18n-rtl.md). Twinzy ships `en` + `ar` (RTL),
so every key lands in both catalogs, in the same change.

> Cross-side note: an error scenario is a contract with BOTH sides. The NestJS API returns a stable
> `messageKey` (defined in `packages/shared` / `apps/api`, thrown via a typed `AppError`); the web
> dictionary renders it. When you add a backend `messageKey`, add its web string here in the same
> delivery stream and never return localized prose from the API.

## Steps

1. **Choose the namespace.** Namespaces are the top-level objects in the message catalogs and are
   enumerated in `apps/web/src/shared/i18n/i18n-namespaces.constants.ts` (`I18N_NAMESPACES`:
   `app`, `nav`, `home`, `game`, `settings`, `errors`, `notFound`, `errorPage`, `legal`, ...). A new
   feature module gets its own namespace; add it to `I18N_NAMESPACES` in the same change as the
   catalog entry.
2. **Add the key to BOTH catalogs** — `apps/web/src/packages/i18n/messages/en.json` AND
   `apps/web/src/packages/i18n/messages/ar.json`. Never land one without the other: the app supports
   `en` and `ar` (`SUPPORTED_LOCALES` in `@/packages/i18n`) and a missing key surfaces at runtime in
   the other locale. Arabic copy must be real Arabic, not transliterated English.
3. **Register the key in the module's message-keys constants file.** Hooks never pass raw key
   strings to `t()`. Each module owns a `constants/<feature>-message-keys.constants.ts` with keys
   relative to the namespace:

   ```ts
   export const GAME_MESSAGE_KEYS = {
     uploadTitle: 'upload.title',
     uploadSubtitle: 'upload.subtitle',
     // …
   } as const;
   ```

   (`apps/web/src/modules/game/constants/game-message-keys.constants.ts`). Shared-surface copy
   (nav, errors) uses the analogous shared constants. Note the `as const` object — the TS `enum`
   keyword is banned repo-wide.

4. **Use ICU plural/argument syntax where counts or values appear.** Arabic has more plural
   categories than English (`one`, `two`, `few`, `other` at minimum) — never copy the English
   category set into `ar.json`:
   - en: `"matchCount": "{count, plural, one {# match} other {# matches}}"`
   - ar: `"matchCount": "{count, plural, one {تطابق واحد} two {تطابقان} few {# تطابقات} other {# تطابقًا}}"`
     Interpolation uses named arguments: `"sharedAt": "Shared {date}"`, called as
     `t(GAME_MESSAGE_KEYS.sharedAt, { date: formattedDate })`.
5. **Consume via the wrapper only.** Client hooks use
   `useAppTranslation(I18N_NAMESPACES.<ns>)`; server code uses
   `getServerTranslations(I18N_NAMESPACES.<ns>)` — both from `@/packages/i18n`. Raw `next-intl`
   imports outside `apps/web/src/packages/i18n/` are a boundary violation.
6. **Validation-message keys live in schemas.** Zod schemas embed message KEYS, not copy — see the
   upload form schema in `apps/web/src/modules/game/schemas/` — and the hook layer translates them
   before display ([skills/add-form.md](./add-form.md)). On the backend, error `messageKey`s map to
   web strings through the owning feature's error mapper; unknown keys fall back to `errors.generic`,
   never a blank or a raw key on screen.
7. **Verify with tests.**
   - Unit-test any helper that selects keys (e.g. status → key maps) per
     [skills/write-unit-tests-frontend.md](./write-unit-tests-frontend.md).
   - Integration tests assert the rendered English copy through `renderWithProviders`
     (`apps/web/src/tests/helpers/render-with-providers.tsx`), which mounts the real intl provider —
     so a key missing from `en.json` fails the test.
   - Run the gate; the `no-raw-i18n-text` rule catches copy that bypassed the catalog.

## Definition of done

- Key exists in `en.json` AND `ar.json` with correct plural categories per locale.
- Key is exposed through a `*-message-keys.constants.ts` file; no raw key strings at call sites;
  no raw copy in JSX or schemas.
- If the change added a backend `messageKey`, the matching web string and mapper entry ship in the
  same delivery stream, with a safe fallback for unknown keys.

## Validation (gate)

```bash
npm run lint                # no-raw-i18n-text catches copy outside the catalog
npm run typecheck           # tsgo, strict
npm run test:coverage       # Vitest — 95% global, 100% pure key helpers
npm run build               # next build
npm run quality:dead-code   # knip — no orphaned exports
npm run quality:circular    # madge — no import cycles
npm run test:e2e            # relevant Playwright suite
```
