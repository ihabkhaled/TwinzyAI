# 09 — Performance Review

> Run against the finished code by a React performance reviewer (see [agents/README.md](../../../agents/README.md)) or a human reviewer following [skills/performance-review.md](../../../skills/performance-review.md). Norms are defined in [rules/07-performance-scalability.md](../../../rules/07-performance-scalability.md).

## Review scope

- **Code reviewed:** <branch/commit>
- **Reviewer:** <name / agent>
- **Date:** <YYYY-MM-DD>

## Checklist (per skills/performance-review.md)

### Server/client boundary

- [ ] Client boundaries are as low as possible; every `'use client'` file has a justified `// client-boundary-reason:` comment and nothing above it was made client unnecessarily. <Findings.>
- [ ] No server-only work (data fetching, heavy computation) moved into the client where a server component could do it. <Findings.>

### Rendering

- [ ] Components are JSX-only (enforced by [docs/eslint/no-inline-component-logic.md](../../eslint/no-inline-component-logic.md) and [docs/eslint/no-inline-declarations.md](../../eslint/no-inline-declarations.md)), so no per-render closures or object literals leak into hot paths. <Confirm.>
- [ ] Lists over the threshold agreed in stage 02 use `VirtualizedList` (apps/web/src/packages/virtuoso). <Findings.>
- [ ] Zustand selectors are narrow; multi-field reads use `useAppStoreShallow` (apps/web/src/packages/zustand) to avoid over-subscription. <Findings.>

### Data fetching

- [ ] Query keys come from the module's keys builder; caching, staleTime, and invalidation scope reviewed (invalidations target the narrowest key, as `invalidateGameResults` does in apps/web/src/modules/game/queries/game.invalidate.ts). <Findings.>
- [ ] No request waterfalls a single query or parallel queries could avoid; suspense boundaries via `useAppSuspenseQuery` where appropriate. <Findings.>

### Assets and bundle

- [ ] Images go through `AppImage` (apps/web/src/packages/image) with proper sizing. <Findings.>
- [ ] Fonts unchanged (app font loaded via apps/web/src/shared/fonts/app-fonts.ts) or changes justified. <Confirm.>
- [ ] `npm run build` output reviewed: no unexpected growth in the route's first-load JS. Twinzy is mobile-first — budget for constrained devices/networks. <Record numbers below.>

## Measurements

| Metric                                                     | Before  | After   | Budget   | Pass? |
| ---------------------------------------------------------- | ------- | ------- | -------- | ----- |
| Route first-load JS (`npm run build` output)               | <kB>    | <kB>    | <kB>     | <y/n> |
| <interaction latency / LCP on the new screen, if measured> | <value> | <value> | <budget> | <y/n> |

## Findings register

| #   | Severity          | Finding   | Resolution                                    |
| --- | ----------------- | --------- | --------------------------------------------- |
| 1   | <high/medium/low> | <finding> | <fixed in <commit> / accepted with rationale> |

## Gate

- [ ] No unresolved high-severity finding
- [ ] Build-size numbers recorded and within budget
- [ ] Deliberate trade-offs recorded (and mirrored to memory/performance-decisions.md if durable)

**Signed off by:** <name> — <YYYY-MM-DD>
