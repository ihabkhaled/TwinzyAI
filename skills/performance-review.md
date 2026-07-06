# Skill: Performance Review

> Applies rules/07. Output: docs/performance-review-report.md.

1. Bundle: check Next build output sizes; flag heavy deps; confirm lazy-loading below the
   fold.
2. Rerenders: verify main-flow components are pure and state is hook-scoped.
3. Memory: object URLs revoked; image buffer wiped in `finally`; no per-request growth.
4. Caps: `MAX_IMAGE_SIZE_BYTES` enforced before buffering; AI outputs bounded by their Zod
   schemas; every list/collection has a cap constant — nothing unbounded.
5. Timeouts: every external call is bounded (`GEMINI_TIMEOUT_MS` on AI calls, ClamAV socket
   timeouts); no unbounded concurrency; rate limits protect the expensive analyze route.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
