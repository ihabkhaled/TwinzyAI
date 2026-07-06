# Observability Decisions

> How this backend stays diagnosable: one logger port, structured redacted logs, a request id
> on every line, and a strict level policy. The enforced rule is
> [/rules/22-observability-logging.md](../rules/22-observability-logging.md); this file records
> what we chose and why.

## Decision 1 — pino behind the AppLogger port; never `console.*`

**What:** the logging engine is **pino** (wired via `nestjs-pino` + `pino-http`, with
`pino-pretty` as the dev transport). Business code never imports pino — it injects the
**AppLogger port** from `apps/api/src/core/logger/`. `console.*` is banned in `src/`.

**Why:** the engine is a swappable vendor detail ([library-boundaries.md](./library-boundaries.md));
the port is the stable surface and the single choke point for levels, redaction, and transport.
pino-http gives request-scoped context and HTTP access logs for free on Fastify.

**Pitfall:** a context-bound (transient-scoped) logger cannot be fetched with `app.get()` in
bootstrap/tests — use `await app.resolve()` ([known-pitfalls.md](./known-pitfalls.md)).

## Decision 2 — Structured logs: stable event name + metadata object

Message strings are constant, dotted event names; all variable data goes into the structured
metadata object. Log **identifiers and outcomes**, never payloads: no image bytes or buffers,
no trait text, no AI prompt/response bodies, no whole request bodies. Interpolating objects
into messages is a lint error and an unsearchable log line.

## Decision 3 — Redaction is configured in the engine AND respected at call sites

pino `redact` paths cover the hostile-by-default fields — `authorization` and `cookie` headers,
tokens/keys/secrets — as defense in depth; the first line of defense is that call sites only
pass identifiers. When a new sensitive field appears, extend the redact list and the call-site
discipline in the same change. A leaked log line has the same blast radius as a leaked
response. Privacy-specific: nothing derived from the uploaded image is ever loggable
([privacy-decisions.md](./privacy-decisions.md)).

## Decision 4 — One request id, on every line

A request id is generated (or accepted) per request by pino-http and appears on every log line
emitted while serving that request, including adapter calls (Gemini, clamd). It is the joining
key for diagnosing a failed analyze run. Tracing only — never used for authorization.

## Decision 5 — Level policy: 4xx → `warn`, 5xx → `error`

Expected client failures (validation 400, payload-too-large 413, throttle 429) log at `warn` —
they are signal about clients, not system failure, and must not page anyone. Server-side
failures (unhandled errors, `IntegrationError` 502 from Gemini/clamd) log at `error` with full
detail server-side while the client receives only the sanitized envelope
([architecture-decisions.md](./architecture-decisions.md)). Every exercised `catch` logs before
rethrow/fallback; empty `catch {}` is banned.

## Decision 6 — No metrics/APM today

No metrics backend or tracing vendor is wired. If one is adopted, it goes behind a `core/` port
with an ADR, same as any vendor ([library-boundaries.md](./library-boundaries.md)). Health
endpoints + structured logs are the current operational surface (Docker healthchecks —
[reliability-patterns.md](./reliability-patterns.md)).

**Related:** [/rules/22-observability-logging.md](../rules/22-observability-logging.md) ·
[library-boundaries.md](./library-boundaries.md) · [security-decisions.md](./security-decisions.md) ·
[known-pitfalls.md](./known-pitfalls.md)
