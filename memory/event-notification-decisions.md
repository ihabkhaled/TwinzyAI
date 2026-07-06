# Event & Notification Decisions

> **Standing decision: no domain events, no queues, no message broker, no notification channels
> today.** The entire product is a single synchronous request/response pipeline (upload →
> analyze → respond) with nothing persisted and no accounts to notify.

## Decision 1 — Request/response only; no async infrastructure

**What:** the analyze pipeline runs in-process, sequentially, inside one HTTP request. There is
no event bus, no job queue, no scheduler, no broker client in the dependency tree.

**Why:** every async-infrastructure justification is absent here: nothing must survive a
restart (nothing is persisted — [database-decisions.md](./database-decisions.md)), there is no
cross-service fan-out (one deployable), and there are no user accounts, so there is no email/
SMS/push to deliver. Adding a broker would add operational surface and a new data-retention
question (queued payloads are stored data) with zero payoff.

## Decision 2 — Side effects are in-process and fail-safe

Anything that is not the primary response (logging enrichment, best-effort cleanup, future
counters) runs in-process and **fail-safe**: wrapped in try/catch, failure logged via the
`AppLogger` port at `error`/`warn`, never rethrown into the request flow. A failed side effect
must never fail the user's game. Rule: [/rules/08-reliability-durability.md](../rules/08-reliability-durability.md);
pattern details: [reliability-patterns.md](./reliability-patterns.md). The one non-negotiable
"side effect" that is NOT fail-safe is the image-buffer zero-fill in `finally` — that always
runs, success or failure.

## Decision 3 — Adoption criteria (if ever needed)

Introduce events/queues only when at least one of these becomes true, and then only via an ADR
under [/architecture/adrs/](../architecture/adrs/README.md):

- work must survive a process restart (durable jobs),
- retries with backoff must outlive the originating request,
- a second deployable needs to consume what this app produces.

If adopted: the broker/bus client is wrapped behind a `core/` port (never imported in business
code — [library-boundaries.md](./library-boundaries.md)), handlers are fail-safe and
self-contained, event names/payloads are typed contracts in `packages/shared` or `model/`, and
queued payloads pass the same privacy review as any storage (no image-derived data, ever).

## Decision 4 — Never payment or identity events

The game is free and anonymous. There will never be payment webhooks, billing events, or
account-lifecycle notifications — proposals in that direction violate product invariants, not
just architecture ([/rules/14-ai-safety.md](../rules/14-ai-safety.md)).

**Related:** [reliability-patterns.md](./reliability-patterns.md) ·
[database-decisions.md](./database-decisions.md) ·
[observability-decisions.md](./observability-decisions.md) ·
[/rules/08-reliability-durability.md](../rules/08-reliability-durability.md)
