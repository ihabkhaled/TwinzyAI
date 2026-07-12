<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: Latency, memory, throughput, bundle size

Task type: `performance-change` · Lane: **standard** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- Measure before and after; no speculative optimization.
- Never trade away validation, safety, or clarity for micro-gains.
- Frontend perf respects component-size caps — split, don't inline.

## Must-read docs

- rules/07-performance-scalability.md — > Performance is a design constraint, not a later optimization: every external call bounded, every list capped, every instance stateless so the app scales horizontally without rewrites. Implements rules 19, 31, 37 of [00-non-negotiable-r... (~1332 tokens)
- docs/performance-review-report.md — Date: 2026-07-05 · Scope: full stack · Method: skills/performance-review.md (~347 tokens)

## Rules

- rules/07-performance-scalability.md — > Performance is a design constraint, not a later optimization: every external call bounded, every list capped, every instance stateless so the app scales horizontally without rewrites. Implements rules 19, 31, 37 of [00-non-negotiable-r... (~1332 tokens)
- rules/frontend/12-performance.md — Performance is an architectural property here, not an optimization pass. The rules below keep the (~982 tokens)

## Skills

- skills/performance-review.md
- skills/performance-review-frontend.md

## Reviewers

- agents/backend-performance-reviewer.md
- agents/react-performance-reviewer.md

## Validation before done

- `npm run test:coverage`
- `npm run load-test`

## Notes

Backend levers: timeouts, byte caps, concurrency env knobs. Frontend: React/Next patterns per rules/frontend/12-performance.md. Use npm run load-test for API paths.
