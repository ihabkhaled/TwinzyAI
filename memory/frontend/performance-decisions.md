# Performance Decisions (Frontend)

Rationale for the Twinzy frontend performance posture. Normative rule:
[`rules/frontend/12-performance.md`](../../rules/frontend/12-performance.md).

## Server-first rendering

- **Decision:** components are server components by default. `'use client'` is opt-in, requires a
  `// client-boundary-reason: …` comment (rule `require-client-component-reason`), and boundaries are
  pushed to the leaves — containers and interactive primitives, never whole routes.
- **Rejected alternative:** marking route trees `'use client'` for convenience.
- **Why:** every client boundary ships its subtree's JS to the browser and moves rendering work onto
  the user's device. Making the boundary cost visible (a mandatory written reason) is what keeps the
  client bundle from growing by default. Reference reasons: `packages/query/app-query-provider.tsx`
  (query cache lives in browser memory), `packages/virtuoso/virtualized-list.tsx` (viewport
  measurement). Twinzy is phone-first, so client-JS discipline is directly a user-latency budget.

## No premature memoization

- **Decision:** `useMemo`, `useCallback`, and `React.memo` are not used speculatively. They are added
  only after a measured re-render problem (React DevTools profiler) and the measurement is noted at
  the call site.
- **Rejected alternative:** blanket memoization "for safety".
- **Why:** the architecture already removes the classic causes of render storms — components are
  JSX-only (`*.component.tsx`, no hooks, no inline declarations, enforced by `no-inline-declarations`
  and `no-inline-component-logic`), containers own the single `.map()`, and derived data is built once
  in hooks. On React 19, speculative memo mostly adds comparison cost and hides dependency bugs. The
  React Compiler is the expected long-term answer; hand-memo added now would be debt then.

## Virtualization threshold: 100 rows

- **Decision:** any list that can reach 100+ rows MUST render through `VirtualizedList`
  (`packages/virtuoso/virtualized-list.tsx`) instead of a bare `.map()`. Below that, containers map
  normally.
- **Why:** measured DOM cost becomes user-visible (scroll jank, slow hydration) in the low hundreds of
  rows; 100 is the round floor that leaves margin. Virtualizing small lists is a net loss — it adds a
  scroll container, absolute positioning, and measurement work for nothing, and complicates
  accessibility. Twinzy's match lists are short by design, so most surfaces map normally.

## Query cache defaults: staleTime 30s

- **Decision:** the app-wide QueryClient (`packages/query/app-query-provider.tsx`) sets
  `staleTime: 30_000`, `gcTime: 5 * 60_000`, `retry: 1`, `refetchOnWindowFocus: false`.
- **Rejected alternative:** TanStack's default `staleTime: 0`.
- **Why:** `staleTime: 0` refetches on every mount and navigation, which for a BFF-backed app means
  redundant same-origin round trips users can feel. 30 seconds keeps route transitions instant from
  cache while bounding staleness below anything our data cares about; mutations bypass it anyway via
  explicit invalidation. Queries with stricter freshness needs override per-query — never by lowering
  the global default. `refetchOnWindowFocus: false` because focus-triggered refetches produce
  unexplained spinners and duplicate load, not freshness users asked for.

## Devtools only in local

- **Decision:** `ReactQueryDevtools` mounts only when `publicEnv.appEnv === 'local'`
  (`packages/query/app-query-provider.tsx`); the env value comes from Zod-validated
  `NEXT_PUBLIC_APP_ENV` via `packages/env`.
- **Why:** devtools add bundle weight and expose the full query cache to anyone opening the panel.
  Gating on the validated env (not `NODE_ENV`) means preview and production builds are provably clean
  while local keeps full introspection.

## Standing habits

- Images render through `AppImage` (`packages/image`) so sizing/optimization defaults apply
  everywhere; the system font stack is used (no `next/font` network fetch) to keep Docker builds
  offline-safe and avoid a font round-trip on first paint.
- The game's reveal/celebration animations respect `prefers-reduced-motion` (read via
  `packages/browser`) and are kept off the critical rendering path.
- Performance review of a feature happens before release as part of the frontend release gate
  ([`rules/frontend/19-release-gates.md`](../../rules/frontend/19-release-gates.md)).
