# 01 — Next.js App Router Architecture

`apps/web/src/app` is a routing shell, not a feature area. Every file in it MUST be one of the App
Router conventions (page, layout, route, error, loading, not-found, providers) or a colocated
`*.variants.ts` style bundle. Feature logic never lives here.

## Composition rule

- A `page.tsx` MUST only compose: metadata, a page title via `buildPageTitle`
  (`apps/web/src/shared/helpers/page-title.helper.ts`), layout primitives, and one or more module
  containers imported from `@/modules/<feature>`.
- `apps/web/src/app` MUST NOT import module internals (services, hooks, components) — only the
  module's public surface. Enforced by `no-cross-module-deep-imports` and the layer policy table in
  [eslint/architecture.config.mjs](../../eslint/architecture.config.mjs).
- Data fetching, state, and translation orchestration belong to the module, not the page.

## Route groups

Routes are organized into route groups; new routes MUST join one of them (or justify a new group in
an ADR under [architecture/adrs/](../../architecture/adrs/)). Twinzy's live surface today is the game
flow, plus the marketing/legal/help pages:

| Group      | Purpose                                            | Example routes                                                                  |
| ---------- | -------------------------------------------------- | ------------------------------------------------------------------------------- |
| `(public)` | Unauthenticated landing / marketing                | `apps/web/src/app/(public)/page.tsx` (`/`)                                       |
| `(game)`   | The core play flow (upload → match → result)       | `apps/web/src/app/(game)/game/page.tsx` (`/game`)                               |
| `(legal)`  | Privacy, terms, help                               | `apps/web/src/app/(legal)/privacy/page.tsx`, `.../terms/page.tsx`, `.../help/page.tsx` |

Every route path MUST also exist in `ROUTE_PATHS`
(`apps/web/src/shared/constants/route-paths.constants.ts`); navigation uses those constants with
`AppLink` / `useAppNavigation`, never string literals. Follow
[skills/add-route.md](../../skills/add-route.md) when adding one.

## File conventions

- `layout.tsx` — the root layout wires fonts (`appFont` from `apps/web/src/shared/fonts/app-fonts.ts`),
  locale and `dir` attributes, and `providers.tsx`. Nested layouts only when a group genuinely shares
  chrome.
- `error.tsx` / `global-error.tsx` — error boundaries render sanitized message keys;
  `global-error.tsx` is the only file allowed to use `FALLBACK_ERROR_COPY`
  (`apps/web/src/shared/constants/fallback-copy.constants.ts`) because the i18n provider may itself
  have crashed.
- `loading.tsx` / `not-found.tsx` — must exist at the root; keep them presentational.
- Route handlers live under `apps/web/src/app/api/`: the health endpoint
  (`apps/web/src/app/api/health/route.ts`) delegates to the health module's `buildHealthReport`
  service, and the BFF catch-all (`apps/web/src/app/api/gateway/[...path]/route.ts`) delegates to
  `gateway-handler.ts`. Route files MUST stay thin delegates — logic lives in the handler/service they
  call.

## Server-component-first

Everything is a Server Component until proven otherwise. A file MUST NOT start with `'use client'`
unless it needs state, effects, browser APIs (via wrappers), or event handlers. When it does, the
directive MUST be followed immediately by a reason comment:

```tsx
'use client';
// client-boundary-reason: connects the interactive game-round query hook to presentational components.
```

Enforced by `require-client-component-reason`
([docs/eslint/require-client-component-reason.md](../../docs/eslint/require-client-component-reason.md)).
Push client boundaries down: a page stays server-rendered while its interactive container opts in.
Server-only code (like `getServerEnv` from `@/packages/env/server`) is guarded by the `server-only`
marker and `no-server-only-import-in-client`.

## apps/web/src/proxy.ts

`apps/web/src/proxy.ts` is the Next 16 per-request proxy. It generates a nonce, builds the
Content-Security-Policy (`script-src 'self' 'nonce-…' 'strict-dynamic'`), and forwards both on request
headers so Next stamps the nonce onto its inline scripts. It MUST NOT gain unrelated responsibilities
(auth checks, logging, redirects) without an ADR — it runs on every request. Static security headers
stay in [apps/web/next.config.ts](../../apps/web/next.config.ts); see [11-security.md](11-security.md).
