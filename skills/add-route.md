# Skill: Add a Route

Use this skill to add a new page under `apps/web/src/app/`. Routes are thin: a `page.tsx` composes
module containers and shared layout primitives — it never contains feature logic. Doctrine:
[rules/frontend/01-next-app-router-architecture.md](../rules/frontend/01-next-app-router-architecture.md).

## Steps

1. **Pick the route group.** Twinzy is a mobile-first PWA with a small surface; group by layout
   shell under `apps/web/src/app/`:
   - `(marketing)` — the public landing surface (home lives at `apps/web/src/app/page.tsx` today;
     legal/help pages `privacy`, `terms`, `help` share the marketing shell).
   - `(game)` — the play flow (`apps/web/src/app/(game)/game/page.tsx`).
     Create a new group only when the new page needs a different layout shell; otherwise reuse.
2. **Register the path constant.** Add the path to `ROUTE_PATHS` in
   `apps/web/src/shared/constants/route-paths.constants.ts` (typed as `Route`, so `typedRoutes`
   catches dead links at build time). Raw path strings in app code are a no-magic-strings violation.
3. **Add the i18n copy.** Every page needs at least `title` and `subtitle` keys. Follow
   [skills/add-i18n-message-key.md](./add-i18n-message-key.md): add the namespace to
   `I18N_NAMESPACES` if new, and add keys to BOTH `apps/web/src/packages/i18n/messages/en.json` and
   `apps/web/src/packages/i18n/messages/ar.json`.
4. **Write `page.tsx`** as an async Server Component. Copy the shape of the canonical page:

   ```tsx
   export async function generateMetadata(): Promise<Metadata> {
     const t = await getServerTranslations(I18N_NAMESPACES.game);

     return { title: buildPageTitle(t('title')) };
   }
   ```

   Rules:
   - `generateMetadata` MUST use `buildPageTitle` from
     `apps/web/src/shared/helpers/page-title.helper.ts` ("Section · Twinzy" format).
   - Translations come from `getServerTranslations` (`@/packages/i18n`) with an
     `I18N_NAMESPACES` constant — never a raw namespace string.
   - The body composes `PageContainer` (from `@/packages/ui-primitives`), the shared
     `PageHeader` component, and the module's container imported from the module public
     surface (`@/modules/<feature>` — never a deep path).
   - No `'use client'` in `page.tsx`. Interactivity lives in the module's container.
   - Also add PWA/SEO surface where relevant (viewport, `manifest`, and — for shareable results —
     Open Graph metadata) via the shared metadata helpers.
5. **Add the navigation link.** Extend the header/nav with an `AppLink` (from
   `@/packages/link`) pointing at the new `ROUTE_PATHS` entry, labeled with a key in the
   `nav` namespace of both message catalogs.
6. **Write the e2e smoke test** in `apps/web/src/tests/e2e/<feature>.e2e.ts` per
   [skills/write-e2e-tests-frontend.md](./write-e2e-tests-frontend.md): navigate to the route,
   assert the page title (`buildPageTitle` output) and one stable `TEST_IDS` element. Playwright's
   `webServer` (see `apps/web/playwright.config.ts`) starts the app with
   `SERVER_API_MOCKING: 'enabled'`, so the page must render fully against mock fixtures.
7. **Gate.** Run the standard gate; `npm run build` (typedRoutes) verifies every `AppLink` target.

## Twinzy guardrail

- Never add a route that requires login, payment, or account state — there is none. Legal pages
  (privacy/terms) must stay reachable; they document the no-persistence, no-biometric guarantees.

## Validation (gate)

```bash
npm run lint                # ESLint flat config — 0 errors, 0 warnings
npm run typecheck           # tsgo, strict
npm run test:coverage       # Vitest — 95% global, 100% pure layers
npm run build               # next build — typedRoutes verifies every AppLink target
npm run quality:dead-code   # knip — no orphaned exports
npm run quality:circular    # madge — no import cycles
npm run test:e2e            # route smoke spec (+ test:a11y for the new page)
```

## Definition of done

- `page.tsx` is Server Component + composition only; metadata via `buildPageTitle`.
- `ROUTE_PATHS` entry, nav link, en + ar copy, e2e smoke test.
- The full gate above is green.
