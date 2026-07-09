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

## Scalability model + what we deliberately do NOT add

The scaling story is **stateless instances behind an orchestrator that adds replicas**, each
instance protecting itself with a per-instance in-flight cap (`core/streaming` ConcurrencyLimiter)
and per-IP throttling. No shared state means no coordination, so replicas scale linearly. The
`load-test` script (`scripts/load-test.mjs`, `npm run load-test`) is the durable way to verify a
running instance stays non-blocking and sheds excess load as 429s under concurrency.

Three "scalability" upgrades were considered and **rejected** as premature or contradicting the
design — do not add them without a workload that actually needs them:

- **worker_threads to offload base64 encoding.** The upload is buffered once and base64-encoded
  once per run (~single-digit ms for a 5 MB image); the structured-clone copy into a worker would
  cost more than the encode it removes. Pure overhead on the hot path.
- **Redis-backed ConcurrencyLimiter / StreamRegistry.** These are intentionally per-instance:
  the cap protects THIS process's memory/CPU, and a stream lives on the socket it was opened on,
  so a cross-instance store buys nothing and introduces shared state + a new failure dependency —
  directly against the stateless, no-persistence, no-broker model ([reliability-patterns.md](./reliability-patterns.md)).
- **Node `cluster` inside the container.** One process per container + orchestrator replicas is
  simpler, gives per-process isolation, and is what the stateless design already enables. Cluster
  mode adds intra-container coordination for no gain over horizontal replicas.

If a genuinely CPU-bound step or a cross-instance coordination need appears later, revisit — but
measure first with `load-test`, and keep the interactive request path lean.
