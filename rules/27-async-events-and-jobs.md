# 27 — Async, Events & Jobs

> **Twinzy has no message broker, no queues, no domain-event bus, and no background jobs — by standing decision.** The product is a synchronous request/response pipeline: upload → analyze → result. This file governs the async work that *does* exist (AI calls, fire-and-forget side effects) and binds the moment anyone proposes events or jobs. Implements rules 36–37 of [00-non-negotiable-rules.md](./00-non-negotiable-rules.md).

The failure modes this file prevents: **losing work, blocking the caller, or spinning a client forever.** Every async path must be named, isolated, observable, and **terminal**.

---

## 1. What async work exists today

| Async surface | Contract |
| --- | --- |
| AI provider calls (trait / candidates / judge) | Explicit timeout (`GEMINI_TIMEOUT_MS`, `AbortController` in the adapter — [08-reliability-durability.md](./08-reliability-durability.md)); outcome is always terminal: typed success, typed `IntegrationError`, or timeout mapped to a typed error. Never an unresolved hang. |
| ClamAV scan | Socket timeout; fail-closed in production ([15-file-upload-security.md](./15-file-upload-security.md)) |
| Fire-and-forget side effects (telemetry/log hooks) | Fail-safe: each owns its `try/catch` + logger; a failure never blocks or fails the pipeline (§2) |
| Frontend request lifecycle | Every request renders success, error, or timeout UI — the stop condition is always observable; no endless spinner |

## 2. Fire-and-forget is fail-safe, always

Anything the user isn't waiting on catches its **own** errors. A side-effect throw must never propagate into the pipeline's success path — this is the single most repeated reliability mistake.

```ts
// Do — isolated failure, logged, swallowed deliberately
try {
  await this.telemetry.recordPipelineOutcome(outcome);
} catch (error: unknown) {
  this.logger.warn('telemetry.failed', { requestId, error: toErrorMessage(error) });
}

// Don't — floating promise (lint error) or unguarded await in the success path
void this.telemetry.recordPipelineOutcome(outcome);      // ✗ unobserved rejection
await this.telemetry.recordPipelineOutcome(outcome);      // ✗ side-effect failure fails the game
```

`no-floating-promises` is `error`: detach only through an owned catch; never `void someAsync()` and hope.

## 3. Terminal outcomes — no endless loading

Every async operation ends in **success, failure, or timeout**, and the caller can observe which:

- The analyze request itself: typed result, typed error envelope, or timeout error — the frontend always reaches a terminal UI state.
- A swallowed error with no terminal signal is a defect even when "nothing crashed" — the user spins forever.
- Timeouts are terminal states, not hangs: an aborted AI call maps to a typed error with a friendly `messageKey`.

## 4. What async code must never do

- **Never** `await` a fire-and-forget side effect in a way that couples the pipeline to its latency or failure.
- **Never** leave a floating promise; **never** swallow an error without a log **and** a terminal outcome.
- **Never** retry without a cap, backoff, and a transient-vs-permanent decision (and never auto-retry the whole analyze pipeline — [08-reliability-durability.md](./08-reliability-durability.md)).
- **Never** use `Promise.all|allSettled|any|race` inside a service — fan-out lives in a use case or `lib/` helper, bounded ([07-performance-scalability.md](./07-performance-scalability.md)).
- **Never** put image data in any async payload beyond the trait-extraction call itself ([14-ai-safety.md](./14-ai-safety.md)).

## 5. If events or jobs are ever introduced (standing rule)

Adding a broker, queue, cron, in-process event bus, or any deferred execution is an architecture change: **ADR first** ([/memory/architecture-decisions.md](../memory/architecture-decisions.md)), plus the owning-module rule ([10-library-modularization.md](./10-library-modularization.md)) — the emitter/queue client is wrapped in one `core/` module, never imported in business code. The design must arrive with all of:

- **Named:** event/job names are as-const members in `model/`, past-tense `<feature>.<action>` — no magic strings; payloads typed in `model/`, carrying identifiers + a request id, never secrets, entities, or image data.
- **Idempotent:** at-least-once delivery assumed; handlers dedupe on a stable key so a replay touches nothing new.
- **Isolated:** every handler wraps its body in `try/catch`; a delivery failure never aborts the publisher; bounded retry (transient-only, backoff + jitter), then a dead-letter path — never silent drop, never infinite redelivery.
- **Observable:** request-id traceability from trigger to effect; depth/failure monitored ([22-observability-logging.md](./22-observability-logging.md)).
- **Terminal:** every job reaches a persisted `COMPLETED | FAILED | TIMED_OUT` state (as-const, not raw strings) with operator visibility; the terminal record and any signal are isolated in separate `try/catch` blocks so a failed signal can't skip the durable record.

---

## Checklist

- [ ] No broker/queue/event-bus/job code exists without an ADR — the standing decision holds
- [ ] Every AI/scan call has an explicit timeout and a terminal typed outcome
- [ ] Fire-and-forget side effects own their `try/catch` + logger; zero floating promises
- [ ] Every request path reaches a terminal UI/API state — no endless loading anywhere
- [ ] No `Promise.all*` in services; fan-out bounded, settled-handled
- [ ] (If ever introduced) events/jobs are named, idempotent, isolated, observable, terminal, and owned by one module
