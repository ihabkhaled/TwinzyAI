# Performance Decisions

Rule: [/rules/07-performance-scalability.md](../rules/07-performance-scalability.md).

- **Fastify 5** is the HTTP platform (Express → Fastify migration) — chosen for throughput on
  the hot upload/analyze path; single deduped fastify copy via root override
  ([backend-stack.md](./backend-stack.md)).
- Gemini calls have a hard timeout (`GEMINI_TIMEOUT_MS`, default 30s) via AbortController — the
  latency ceiling of the whole pipeline is deliberate, not accidental.
- The three AI calls are sequential **by design** (each depends on the previous output);
  do not "optimize" them into parallel calls.
- Upload capped at 5 MB default; the image is buffered exactly once in memory and zero-filled
  in `finally` — no double-buffering, no disk I/O.
- Rate limits are the cost-control for the expensive route: global 30 req/min, analyze
  10 req/min ([security-decisions.md](./security-decisions.md)).
- **No cache by design** — caching AI output would mean persisting derived data, which the
  privacy model forbids ([database-decisions.md](./database-decisions.md)). Nothing to
  invalidate, nothing to leak.
- Stateless instances (nothing persisted) make horizontal scaling the entire scaling story.
- Next standalone output for a small Docker runtime image (web workstream).
