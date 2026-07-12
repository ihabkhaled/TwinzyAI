# 15 - Developer Validation Report

## Summary

All quality gates pass on the delivered change (single gate-green slice on `main`). Validated on the
full tree.

## Gate evidence

| Gate | Command | Result |
| --- | --- | --- |
| Lint (ESLint + architecture plugin) | `npm run lint` | Pass — clean. No `eslint-disable`, no `@ts-ignore`, no `any`, no `enum`. |
| Type check (tsgo) | `npm run typecheck` | Pass — all workspaces clean. |
| Format | `npm run format:check` | Pass — clean. |
| Unit + integration + shared tests | `npm run test` | **1021 passed / 1021 (153 files)**. |
| Coverage (touched-module gate) | `npm run test:coverage` | Global **97.01% stmts / 92.52% branches / 97.22% funcs / 97.12% lines** — above the 95/90/95/95 gate. |
| Dead code | `npm run quality:dead-code` | Pass — knip clean. |
| Circular deps | `npm run quality:circular` | Pass — madge: no circular dependency. |
| Production build | `npm run build` | Pass — api + web + shared. |

## Functional coverage of the new behavior

- **Fan-out / privacy boundary** — `candidate-recall.service.test.ts`: with the flag on, fan-out
  sends exactly **N text calls and ZERO image calls** (the privacy boundary is asserted, not
  assumed); each lane carries a distinct focus in its prompt; dedupe keeps the higher score; one
  failed lane still returns survivors; all-fail returns `[]` (caller fallback); the budget clamps the
  lane count with a warn. With the flag off, exactly **one un-focused** call is made.
- **Concurrency primitive** — `semaphore.test.ts`: FIFO ordering, timeout rejection
  (`ConcurrencyTimeoutError`), abort-before-start (the task never runs), and permit accounting
  (no leak on double release).
- **Per-step gate** — `ai-step-concurrency.gate.test.ts`: generation permits bound and queue,
  aborted waits reject, judge step provisioned.
- **Deterministic merge** — `candidate-merge.util.test.ts`: canonical-name dedupe (trim / lowercase /
  collapse whitespace) keeps the higher `styleVibeFitScore`; order is score desc then canonical name
  asc; identical lane outputs aggregate identically regardless of completion order.
- **Lane planning** — `candidate-lane-plan.util.test.ts`: lane rotation (strongest / diverse /
  wildcard) and the appended text-only focus section.
- **Pipeline integration** — `style-match.service.test.ts`: extraction remains exactly one image
  call, judging one call; empty recall pool → localized fallback.
- **Config** — `env.schema.test.ts`, `app-config.service.test.ts`: the six new caps parse, honor
  their bounds, and expose getters.

## Operational checks

- No image bytes, secrets, or provider detail appear in any log — lane-failure logging records the
  error **type (name) only**; verified by the recall service test.
- The shared analysis `AbortSignal` threads into every lane and its gate wait; a queued lane whose
  signal aborts never starts — verified by the semaphore and gate tests.

## Adversarial verification

Self-review during implementation surfaced three ESLint/lib-conflict adjustments and one
constructor-param refactor — all resolved before sign-off with every gate green. Details in
[16-dev-bug-log.md](16-dev-bug-log.md).
