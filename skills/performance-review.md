# Skill: Performance Review

> Applies rules/07. Output: docs/performance-review-report.md.

1. Bundle: check Next build output sizes; flag heavy deps; confirm lazy-loading below the fold.
2. Rerenders: verify main-flow components are pure and state is hook-scoped.
3. Memory: object URLs revoked; image buffer wiped; no per-request growth.
4. Backend: timeouts on all external calls; no unbounded concurrency; upload cap enforced.
