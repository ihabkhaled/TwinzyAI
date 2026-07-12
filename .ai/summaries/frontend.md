<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/summaries/frontend.md -->

# Frontend Summary — Anatomy, Modules, Vendors, State, i18n, PWA

Next.js 16 App Router PWA (`apps/web`, React 19, Tailwind v4, mobile-first). Anatomy: `app (routes only) → modules/<feature> → shared → packages/<vendor>`; inside modules: `Component → Hook → Service → Gateway`. No `route.ts` handlers exist — all HTTP goes straight to the NestJS API through gateways (a BFF prefix is reserved unused in `apps/web/src/shared/api/api-routes.constants.ts`).

## Routes (`apps/web/src/app/`)

`/` (landing), `/game`, `/share/[shareId]` (noindex), `/help`, `/privacy`, `/terms`; plus `error.tsx`, `global-error.tsx` (sole user of hardcoded `FALLBACK_ERROR_COPY` — exception EXC-0003), `loading.tsx`, `not-found.tsx`. `src/proxy.ts` mints the per-request CSP nonce (see `knowledge/summaries/security.md`).

## Feature modules

- **`modules/game`** (public surface: `PrivacyNotice`, `GameContainer`, `LandingContainer`, `SharePageContainer` — `index.ts`; deep imports forbidden). `useGame.hook.ts` is the single orchestrator composing sub-hooks (upload, camera, result-count, run control, payment flow, run recovery, stream progress, translation, share, PayPal buttons) into one `GameViewModel` switched on `GamePhase` (setup|payment|processing|success|error). Gateways: analyze, analyze-stream (SSE), translate, payment order, share — all responses Zod-validated against `@twinzy/shared`. 16 pure components + 13 containers + `*.variants.ts` convention; 29 unit test files under `test/`.
- **`modules/ui-preferences`** — LocaleSwitcher/ThemeToggle/UiPreferencesEffects; the app's only zustand store (theme, pure — side effects in the effects hook).

## Vendor packages (each the single owner of its library — `apps/web/src/packages/`)

`axios` (httpClient + **the one streaming fetch** `stream-request.ts` + SSE parser), `browser` (SSR-safe globals), `camera`, `env` (`publicEnv` — the only sanctioned client `process.env` reader), `i18n` (next-intl + `messages/{en,ar}.json`), `icons` (lucide allowlist), `image` (AppImage), `link` (AppLink/ExternalLink), `logger`, `navigation`, `paypal` (Buttons SDK wrapper, `isPayPalConfigured`, StrictMode-safe render), `query` (TanStack facade: staleTime 30 s, gcTime 5 m, retry 1/0), `storage` (schema-validated), `toast` (sonner), `ui-primitives` (design system + `cn`), `zod` (`parseSchema`), `zustand` (`createAppStore`). Boundary map: `eslint/package-boundaries.config.mjs`; policy: `rules/frontend/09-library-wrapping.md`. Removed as unused 2026-07-10: dayjs, react-hook-form, react-virtuoso, MSW (`memory/frontend/package-decisions.md`).

## State approach

- **Server data**: TanStack Query only (analyze/translate/share mutations + share-read query; keys from `modules/game/queries/game-query-keys.ts`).
- **Client global state**: zustand via `createAppStore`, used only by ui-preferences. Everything else (file, consent, progress, payment) is plain hook state in `modules/game/hooks/`.
- The uploaded image is only an in-memory `File` + object URL — never written to any browser storage (`useImageUpload.hook.ts`).

## SSE client

Transport: `packages/axios/stream-request.ts` (multipart streaming POST, deliberately no client timeout — server heartbeats keep it alive; abort closes the socket). Protocol: `modules/game/gateway/game-stream.gateway.ts` — frames Zod-validated with `GameStreamMessageSchema`, filtered by the per-tab sessionStorage uuid (`twinzy.tabId`) + per-run requestId sent via `STREAM_ID_HEADERS`.

## Payments/donation surfaces

`usePaymentFlow.hook.ts` runs free when `isPayPalConfigured()` is false; when on, it creates a server-priced order (`payment.gateway.ts` — price never sent) and starts the run with `paypalOrderId` in the multipart body. `NEXT_PUBLIC_PAYMENT_PRICE_*` are display-only. Donate link: `shared/helpers/donate-link.helper.ts` from strictly-validated `NEXT_PUBLIC_PAYPAL_ME_USERNAME`, hidden when unset. Full surface list: web-app section 13 references in `docs/features/paypal-donations-and-paid-results/`.

## i18n + RTL

next-intl, cookie-based (`NEXT_LOCALE`, no locale routing) wired via `packages/i18n/request.ts`; catalogs `messages/en.json` + `messages/ar.json` key-for-key (ar is RTL; logical Tailwind utilities only — `rules/frontend/14-i18n-rtl.md`). AI result content is localized server-side; locale switch triggers the text-only translate endpoint. All copy through keys (`no-raw-i18n-text`).

## PWA

`apps/web/public/manifest.webmanifest` + `public/icons/icon.svg`, linked in `app/layout.tsx` metadata; installability verified by `apps/web/src/tests/pwa.test.ts` and `apps/web/e2e/pwa-a11y.spec.ts`. Static security headers (nosniff, X-Frame-Options DENY, Permissions-Policy `camera=(self)`, HSTS) live in `apps/web/next.config.ts`.

Testing (unit web-unit project, Playwright e2e with paywall pinned OFF): `knowledge/summaries/testing.md`.
