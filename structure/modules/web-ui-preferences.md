---
id: structure-module-web-ui-preferences
title: Module — web ui-preferences (Theme and Locale)
type: structure
authority: canonical
status: current
owner: repository owner
summary: The theme and locale preferences module — switcher/toggle/effects containers, cookie persistence, html attribute mirroring, and the app's only zustand store.
keywords: [web, ui-preferences, theme, locale, zustand, cookie, rtl, dark-mode, i18n]
contextTier: 2
relatedCode: [apps/web/src/modules/ui-preferences]
relatedTests: [apps/web/src/modules/ui-preferences/test]
relatedDocs: [docs/frontend-architecture.md, rules/12-i18n.md, structure/layer-map.md]
readWhen: You are changing theming, locale switching, or client-preference persistence.
---

# Module — `apps/web/src/modules/ui-preferences`

**Responsibility.** Theme + locale preferences: the header controls, hydration/persistence
effects, and the only global client store in the app.

## Public surface (`index.ts`)

`LocaleSwitcher`, `ThemeToggle`, `UiPreferencesEffects` (all containers; mounted from the
root layout / providers — `apps/web/src/app/layout.tsx`, `apps/web/src/app/providers.tsx`).

## Key files

| File | Role |
| --- | --- |
| `hooks/useThemeToggle` | Light/dark flip; collapses `system` to a concrete scheme |
| `hooks/useLocaleSwitcher` | Writes the `NEXT_LOCALE` cookie + `router.refresh` (cookie-based next-intl, no locale routing — `apps/web/src/packages/i18n/request.ts`) |
| `hooks/useUiPreferencesEffects` | Hydration from storage, mirrors `data-theme`/`dir` onto `<html>`, persists, writes the resolved-scheme cookie `twinzy.theme` |
| `store/ui-preferences.store.ts` | **The app's only zustand store**, created via `createAppStore` (`apps/web/src/packages/zustand/create-app-store.ts`); holds `{theme, hasHydrated}` only and stays pure — all side effects live in the effects hook |
| `store/ui-preferences.selectors.ts` | Selectors |
| `model/ui-preferences.constants.ts` | `LOCALE_LABEL_KEYS`, DOM attribute names, theme resolution |
| `schemas/ui-preferences.schema.ts`, `types/ui-preferences.types.ts` | Persistence schema + types |

Storage key: `twinzy.ui-preferences.v1`
(`apps/web/src/shared/constants/storage-keys.constants.ts`); reads/writes go through the
schema-validated SSR-safe storage wrapper (`apps/web/src/packages/storage`).

## Invariants

- Server-side theme/locale first paint: the root layout reads the locale cookie and the theme
  cookie (`readThemeAttribute`) to set `<html lang dir data-theme>` before hydration.
- The store never performs side effects; only the effects hook touches DOM/cookies/storage.
- Locale additions are cross-side: catalogs + RTL set in `apps/web/src/packages/i18n` AND
  `LANGUAGE_CODES` in `packages/shared/src/constants/language.constants.ts`
  ([shared.md](shared.md)); currently en + ar (ar is RTL).

## Tests

8 test files under `apps/web/src/modules/ui-preferences/test/` (web-unit project); theme
behavior on mobile is also covered by `apps/web/e2e/mobile-theme.spec.ts`.

## Common changes and risks

- **New theme values**: extend `AppTheme` (`apps/web/src/shared/enums/app-theme.enum.ts`),
  the palette constants, and the persistence schema together.
- **Risk**: low blast radius, but the effects hook touches `<html>` attributes globally —
  regressions show up as flash-of-wrong-theme/dir on every page.
