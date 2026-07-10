# Skill: Add a Large List

> Intent: design a genuinely large frontend list without inventing infrastructure. TwinzyAI has no
> virtualization dependency today because product lists are bounded (results 1–10, candidate pool
> ≤25). Rules 07, frontend/12, and 28–30 apply.

## When to use

Only when an approved workflow can exceed roughly 100 rendered rows and profiling shows rendering
cost. Do not use for current game results, trait accordion groups, or speculative future scale.

## Steps

1. Verify the backend contract is paginated and hard-bounded; never download an unbounded dataset.
2. Measure the real list with React Profiler and record row count/frame cost.
3. Reuse browser-native containment/pagination first. If insufficient, research one maintained
   virtualization dependency and wrap it under `apps/web/src/packages/`.
4. Keep the feature Component → Hook → Service → Gateway chain; query keys include page parameters.
5. Preserve semantic list roles, keyboard access, focus, screen-reader position/count, RTL, and
   variable text height.
6. Test empty/loading/error/page-boundary states and profile the final implementation.

## Checklist

- [ ] Real measured need; backend pagination and caps exist
- [ ] Existing platform/wrapper evaluated first
- [ ] Vendor isolated behind one documented package wrapper if added
- [ ] A11y, RTL, mobile, and focus behavior tested
- [ ] No unbounded client memory or DOM accumulation

## Quality gates

```bash
npm run lint
npm run typecheck
npm run test:coverage
npm run test:e2e:ci
npm run build
npm run security:scan
```

Related: [performance-review-frontend.md](./performance-review-frontend.md) ·
[add-library.md](./add-library.md)
