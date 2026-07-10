# 12 — Performance

Performance is an architectural property here, not an optimization pass. The rules below keep the
client bundle small and rendering work bounded by default — Twinzy is a mobile-first PWA, so the
budget is judged on mid-tier phones, not a developer laptop.

## Server components first

- Every route and component is a React Server Component unless it demonstrably needs browser
  interactivity. `apps/web/src/app` pages (e.g. `apps/web/src/app/(game)/game/page.tsx`) MUST stay
  server components that compose containers.
- `'use client'` is a justified exception, never a default. Every client file MUST carry a
  `// client-boundary-reason: …` comment, enforced by
  [require-client-component-reason](../../docs/eslint/require-client-component-reason.md). If you cannot
  state the reason in one sentence, the boundary is wrong.
- Push client boundaries down: a container (`*.container.tsx`) is the client boundary; the page and
  layout above it stay on the server.

## Route-level loading boundaries

Every route group MUST have a loading boundary so navigation streams immediately —
`apps/web/src/app/loading.tsx` is the root example, built from `Spinner`/`Skeleton` primitives in
`apps/web/src/packages/ui-primitives`. Never block a whole page on one slow query when a skeleton can
render first.

## Images and fonts

- All images go through `AppImage` (`apps/web/src/packages/image`) — it wraps `next/image` (sizing,
  lazy loading, format negotiation) and makes `alt` mandatory. Raw `<img>` is banned by
  [no-raw-package-imports](../../docs/eslint/no-raw-package-imports.md) ownership.
- Remote image hosts MUST be allow-listed in `images.remotePatterns` in
  [apps/web/next.config.ts](../../apps/web/next.config.ts).
- Fonts load only via `next/font` through `apps/web/src/shared/fonts/app-fonts.ts` (`appFont`). Never
  add a `<link>` to a font CDN — it breaks the CSP and adds render-blocking requests.

## Long lists

Current product lists are schema-bounded (results max 10; candidate names max 25), so native mapping
is correct and no virtualization dependency exists. A future 100+ row surface needs measured
profiling and an approved wrapper/dependency decision before implementation.

## Pagination is backend-driven

Future unbounded lists fetch bounded pages from the gateway; the client must not download an entire
dataset to paginate, filter, or sort in memory. Query keys include pagination parameters.

## Memoization only when measured

- Do not sprinkle `useMemo`/`useCallback`/`React.memo` preemptively. Add memoization only after a React
  Profiler measurement shows a real re-render cost, and record the finding in
  [memory/frontend/performance-decisions.md](../../memory/frontend/performance-decisions.md).
- When memoization is justified it lives in hooks, never in components: `*.component.tsx` files are
  JSX-only and may not call hooks ([no-hooks-in-components](../../docs/eslint/no-hooks-in-components.md)).
  Hooks are where derived view models are built and, when measured, memoized.
- Component-level "logic memoization" is structurally impossible by design — inline expressions in
  components are banned by [no-inline-component-logic](../../docs/eslint/no-inline-component-logic.md).

## Web vitals stance

- The budget targets are the Core Web Vitals "good" thresholds: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1
  on mid-tier hardware.
- There is no web-vitals reporting wired today; when field data is needed it MUST enter through an
  owned facade (see the analytics owner plan in
  [16-observability-analytics.md](16-observability-analytics.md)), never a raw third-party snippet —
  the CSP in `apps/web/src/proxy.ts` forbids foreign scripts anyway.
- Regressions found during review follow
  [skills/performance-review.md](../../skills/performance-review.md) and the
  [agents/react-performance-reviewer.md](../../agents/react-performance-reviewer.md)
  charter.
