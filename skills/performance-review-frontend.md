# Skill: Performance Review (Frontend)

Run this review on any diff that adds a dependency, a `'use client'` boundary, a list, an image, or
a query. The binding policy is
[rules/frontend/12-performance.md](../rules/frontend/12-performance.md).

> The backend performance review (caps, timeouts, memory hygiene) is
> [performance-review.md](./performance-review.md). This one is client/render/bundle focused.

## Steps

1. **Client boundary audit.** Every `'use client'` file MUST carry a
   `// client-boundary-reason: …` comment (enforced by `require-client-component-reason`). For each
   new boundary ask: does this file actually need browser interactivity, or did the author mark a
   whole subtree client to silence an error? Boundaries belong on containers (`*.container.tsx`), not
   on pages or layouts in `apps/web/src/app`. Server-only code (`getServerEnv` from
   `@/packages/env/server`, `getServerTranslations`) MUST never sit behind a client boundary.
2. **Bundle impact of new dependencies.** For each new entry in `package.json` dependencies: confirm
   it has an owning wrapper in `apps/web/src/packages/` (so it can be swapped or tree-shaken from one
   place), check its install and parse cost, and prefer an existing owner — icons through
   `@/packages/icons` (named `*Icon` exports only, which keeps lucide-react tree-shakeable). Run
   `npm run build` and compare the route-level first-load JS figures Next prints; call out any route
   that grew and why. This is a mobile-first PWA — bundle weight is a user-facing metric.
3. **List virtualization.** Any list that can grow beyond a screenful MUST render through
   `VirtualizedList` from `@/packages/virtuoso` (react-virtuoso) — see
   [skills/add-virtualized-list.md](./add-virtualized-list.md). Reject raw `.map()` over unbounded
   API collections in containers.
4. **Image usage.** All images go through the app's image wrapper/`next/image`, which makes `alt`
   mandatory and inherits sizing/lazy-loading. Flag raw `<img>` tags, missing width/height (layout
   shift), and any image that should be a static asset. Note: the *uploaded* photo is a transient
   in-memory preview only — revoke object URLs (`URL.revokeObjectURL`) via the browser facade and
   never keep it mounted after submission.
5. **Query caching correctness.** Server state lives in TanStack Query, never in Zustand
   ([rules/frontend/05-tanstack-query.md](../rules/frontend/05-tanstack-query.md),
   [rules/frontend/06-zustand.md](../rules/frontend/06-zustand.md)). Verify:
   - keys come only from the module's builder file (e.g. `gameQueryKeys` in
     `apps/web/src/modules/game/queries/game-query-keys.ts`) — inline arrays are an ESLint error;
   - mutations invalidate the right scope, no broader (`useSubmitPhotoMutation` invalidating via
     `invalidateMatchResults` is the reference — it does not nuke the whole cache);
   - no duplicate fetching: a hook composes `useAppQuery` once and derives view models;
   - suspense variants (`useAppSuspenseQuery`) are used deliberately, not to hide loading states the
     container should render.
6. **Render hygiene.** Components (`*.component.tsx`) are JSX-only by rule, so re-render cost
   concentrates in containers and hooks. Check new hooks for unstable object/array literals fed into
   context or query options, and check Zustand consumers use `useAppStoreShallow` for multi-field
   selection instead of subscribing to the whole store.
7. **Verify with the app running.** `npm run dev` (or `dev:web`), open the affected route, and
   confirm no request waterfalls in the network panel and no long tasks on interaction. For lists,
   scroll and confirm DOM node count stays bounded. Check performance on a throttled mobile profile.

## Done when

Each new client boundary has a defensible reason, `npm run build` shows no unexplained bundle
growth, unbounded lists are virtualized, transient object URLs are revoked, and every cache key and
invalidation traces back to a query-keys builder file.

## Validation (gate)

```bash
npm run lint                # require-client-component-reason + no-inline-query-keys, 0 warnings
npm run typecheck           # tsgo, strict
npm run test:coverage       # Vitest — 95% global
npm run build               # next build — inspect first-load JS per route
npm run quality:dead-code   # knip — no orphaned exports inflating the graph
npm run quality:circular    # madge — no import cycles
```
