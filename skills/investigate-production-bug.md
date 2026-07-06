# Skill: Investigate a Production Bug

> Applies rules/09, 22, 23. A bug without a red test is unconfirmed; a fix without a
> regression test is unfinished.

1. Reproduce FIRST as the smallest failing automated test at the owning layer: unit for
   logic, integration for anything spanning the HTTP chain, e2e only if it needs the
   browser. Red now, green at the end — never weaken the assertion to get there.
2. Diagnose from the logs: `AppLogger` (nestjs-pino) stamps every line with the request id —
   correlate by the id (returned to the client as the request-id header) to reconstruct one
   request end to end. Never add `console.*`; temporary `logger.debug` lines are removed
   before commit and must not log payloads or image data.
3. Classify the defect into exactly ONE owning layer, top-down:
   route -> `core/validation` pipe (bad input accepted?) -> `api/` controller (almost never
   the bug) -> `application/` use case/service (ordering, short-circuit, cleanup) ->
   `domain/` (wrong decision) -> `adapters/` (Gemini/ClamAV timeout, mapping, safety
   filter) -> `infrastructure/`.
4. Check memory/known-pitfalls.md before deep debugging — many "mysteries" are recorded
   traps.
5. Fix in the owning layer with the smallest safe change; no refactor creep, no dependency
   churn. A new failure path gets a typed `AppError` + `messageKey` + web dictionary entry
   (create-error.md, add-i18n-message-key.md).
6. Regression-lock: make the red test green, then cover the sibling call sites and boundary
   values that share the defect, and prove the happy path still works.
7. Record durable learnings (symptom -> root cause -> guard) in memory/known-pitfalls.md.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
