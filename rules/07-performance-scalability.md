# 07 — Performance & Scalability

> Performance is a design constraint, not a later optimization: every external call bounded, every list capped, every instance stateless so the app scales horizontally without rewrites. Implements rules 19, 31, 37 of [00-non-negotiable-rules.md](./00-non-negotiable-rules.md).

Related: [08-reliability-durability.md](./08-reliability-durability.md) · [19-services-application-layer.md](./19-services-application-layer.md) · [27-async-events-and-jobs.md](./27-async-events-and-jobs.md) · [/memory/performance-decisions.md](../memory/performance-decisions.md)

---

## 0. Non-negotiables

1. **Every external call has an explicit timeout.** Gemini calls run under `GEMINI_TIMEOUT_MS` (typed config, never inline); a hung provider must never hang a request.
2. **Every list is bounded — hard cap 100.** No unbounded arrays returned to clients; any future list endpoint paginates with a max page size of 100, and any in-memory collection obeys the same cap.
3. **No `await` in a loop over independent work** — batch or parallelize deliberately.
4. **Concurrency primitives are banned inside services.** `Promise.all|allSettled|any|race` live in a use case or a named `lib/` helper only (ESLint `no-restricted-syntax`).
5. **Payloads are capped.** JSON body limit at bootstrap; image size limited by `MAX_IMAGE_SIZE_BYTES` inside the upload chain.
6. **Instances are stateless** — no request state on providers or module-level variables; horizontal scale is a replica-count change, never a refactor.

---

## 1. Bounded work on the request path

- The analyze pipeline is the hot path: one image in memory at a time per request, released promptly (zero-filled in `finally` — a privacy **and** memory rule).
- No unbounded fan-out over user-controlled input: candidate generation is schema-capped (1–5 candidates, max 4 final results — [14-ai-safety.md](./14-ai-safety.md)); any fan-out over them is chunked and bounded.
- No synchronous CPU-heavy work blocking the event loop (image decode checks are header-level, not full re-encodes).

## 2. Concurrency lives in use cases and `lib/` helpers

Independent async calls run concurrently — but the orchestration is structural, so it lives where the architecture allows it:

```ts
// Don't — fan-out hidden inside a service (ESLint error)
async generateAll(traits: TraitSet): Promise<Candidate[]> {
  return Promise.all(prompts.map((p) => this.gemini.generate(p))); // banned in *.service.ts
}

// Do — name the fan-out in lib/ (or orchestrate in the use case), bounded
// lib/game.helpers.ts
export function dispatchBounded<T>(
  calls: ReadonlyArray<() => Promise<T>>,
): Promise<ReadonlyArray<PromiseSettledResult<T>>> {
  return Promise.allSettled(calls.map((call) => call()));
}
```

Use `allSettled` when one failure must not abort the rest — and handle every settled rejection; no silently dropped errors ([26-error-handling-and-exceptions.md](./26-error-handling-and-exceptions.md)).

## 3. AI call budget

- Explicit timeout (`GEMINI_TIMEOUT_MS`) on every provider call, enforced inside the adapter via `AbortController` ([08-reliability-durability.md](./08-reliability-durability.md)).
- No server-side auto-retry of the analyze pipeline (a whole-pipeline retry doubles cost and latency); retries, if ever added, are per-call, capped, transient-only, and adapter-owned.
- The three prompt stages run in their designed order; independent sub-calls within a stage may parallelize in the use case, bounded.

## 4. Stateless scaling

- No sessions, no sticky state, no in-memory caches acting as a source of truth. Any instance can serve any request — the product is stateless by design (no DB, no image storage).
- Rate-limit state and any future shared state must live behind an adapter, not on instance memory, before the fleet grows beyond one replica.
- Graceful shutdown drains in-flight requests ([08-reliability-durability.md](./08-reliability-durability.md)) so rolling deploys drop nothing.

## 5. Frontend performance

- Mobile bundle lean: no heavy dependency without a [docs/package-decisions.md](../docs/package-decisions.md) entry; lazy-load below-the-fold.
- No needless rerenders: state lives in hooks, components are pure props renderers ([02-frontend-components-tsx.md](./02-frontend-components-tsx.md)).
- Object URLs revoked; upload previews released promptly; no per-request memory growth.

## 6. Document the impact

A PR that adds an external call, a fan-out, or a payload path states in its description: the timeout, the bound/cap, expected latency, and any new shared-state dependency. Durable decisions go to [/memory/performance-decisions.md](../memory/performance-decisions.md).

---

## Checklist

- [ ] Every external call has an explicit, config-sourced timeout
- [ ] Every list/collection bounded (cap 100); payload sizes capped
- [ ] No `await`-in-loop over independent work; fan-out bounded and settled-handled
- [ ] No `Promise.all/allSettled/any/race` inside a service — use case or `lib/` only
- [ ] Buffers/object URLs released promptly; no memory growth per request
- [ ] Instances stateless; shutdown graceful
- [ ] Heavy frontend deps documented; below-fold lazy-loaded
- [ ] Gates green: `npm run lint` · `typecheck` · `test:unit` · `test:coverage` · `build`
