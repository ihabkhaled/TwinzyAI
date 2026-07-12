<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: Timeouts, retries, cancellation, rate limits, overload

Task type: `reliability-change` · Lane: **standard** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- Every remote call has a timeout; every retry has a limit and backoff.
- Cancellation propagates (AbortSignal bridging) end to end.
- Failures map to typed error codes with safe user copy.

## Must-read docs

- rules/08-reliability-durability.md — > The operational playbook for not hanging requests, not leaking buffers, and not crashing the process. Every remote call is bounded and cancellable; every side effect is fail-safe; every workflow reaches a terminal state; shutdown is cl... (~1510 tokens)
- rules/27-async-events-and-jobs.md — > **Twinzy has no message broker, no queues, no domain-event bus, and no background jobs — by standing decision.** The product is a synchronous request/response pipeline: upload → analyze → result. This file governs the async work that *... (~1405 tokens)

## Rules

- rules/08-reliability-durability.md — > The operational playbook for not hanging requests, not leaking buffers, and not crashing the process. Every remote call is bounded and cancellable; every side effect is fail-safe; every workflow reaches a terminal state; shutdown is cl... (~1510 tokens)
- rules/26-error-handling-and-exceptions.md — > Every failure is a **typed `AppError`** carrying a `messageKey`, raised in the layer that detects it and translated **once** at the edge by the global exception filter into the sanitized envelope. Full detail is logged server-side; cli... (~1656 tokens)

## Skills

- skills/reliability-review.md

## Reviewers

- agents/reliability-engineer.md

## Code entrypoints

- `apps/api/src/core/rate-limit/`

## Validation before done

- `npm run test:integration`
- `npm run load-test`

## Notes

Rate limiting lives in core/rate-limit; AI hop/retry policy in the router and adapters. Test overload and abort paths, not just happy paths.
