# 16 - Developer Bug Log

## Internal defect loop

No functional defects were found in the delivered behavior. Three implementation-time adjustments
surfaced during self-review (all lint/type-lib conflicts, not behavior bugs) and one
constructor-shape refactor; each was resolved at the root cause before sign-off with every gate
green.

| ID | Type | Area | Status |
| --- | --- | --- | --- |
| ADJ-1 | Refactor (lint: `max-params`) | `StyleMatchService` constructor | Resolved |
| ADJ-2 | Lint conflict (three rules) | `mergeCandidatePools` Map materialization | Resolved |
| ADJ-3 | Lib-availability (ES2023) | gate/semaphore test permit-holding | Resolved |

### ADJ-1 — StyleMatchService exceeded the constructor param budget

**Symptom:** the initial wiring gave `StyleMatchService` **6** constructor params (it still injected
the generation service + config directly), tripping the ESLint `max-params: 5` rule.

**Root cause:** the single-vs-parallel decision was living in the game module, so `StyleMatchService`
had to hold both the generation collaborator and the config to make it.

**Fix:** moved the flag decision **into** `CandidateRecallService`, so `StyleMatchService` now injects
one recall collaborator instead of the generation service + config — **4** params. Cleaner
encapsulation of the strategy as well as a passing lint gate.

### ADJ-2 — three ESLint rules conflicted on materializing `Map` values

**Symptom:** materializing the dedupe map's values fought three rules at once: `[...map.values()]`
tripped `prefer-iterator-to-array`; `Array.from(map.values())` tripped `prefer-spread`;
`map.values().toArray()` is not in the ES2023 lib.

**Root cause:** every direct way to turn `Map.values()` into an array collided with a lint rule or a
missing lib method.

**Fix:** rewrote `mergeCandidatePools` to accumulate into an **array plus an index map** so it never
iterates `Map.values()` at all — the deterministic order (score desc, canonical name asc) is produced
directly from the array. No suppression; the root cause (iterating `Map.values()`) was removed.

### ADJ-3 — `Promise.withResolvers` unavailable under the ES2023 lib

**Symptom:** the natural way to hold a semaphore permit open in a test is `Promise.withResolvers`
(ES2024), which is not available under the repo's ES2023 lib target.

**Root cause:** lib-target mismatch, not a code defect.

**Fix:** the gate/semaphore concurrency tests hold permits via a `setTimeout`-in-executor promise
plus fake timers — the repo's own existing limiter-test pattern — so no newer lib feature is needed.

## Stability decision

No open internal defects. All three adjustments resolved at the root cause (never by silencing the
linter). Change is internally stable and ready for the documentation/sign-off phase.
