# 13 - Implementation Readiness

## Pre-implementation gate (all satisfied before phase 14)

- [x] Root [`CLAUDE.md`](../../../CLAUDE.md) reviewed; product invariants re-checked at intake
- [x] Feature folder created; phases 00/03/06/08/09/11/12 documented before coding
- [x] Related code read: candidate generation service, style-match service, analyze-game use-case
  (image-wipe), config schema, existing `ConcurrencyLimiter` (to justify a distinct primitive)
- [x] Related tests read: existing ai/game unit tests and fixture stubs
- [x] Governing rules read:
  [`rules/00-non-negotiable-rules.md`](../../../rules/00-non-negotiable-rules.md),
  [`rules/07-performance-scalability.md`](../../../rules/07-performance-scalability.md),
  [`rules/08-reliability-durability.md`](../../../rules/08-reliability-durability.md),
  [`rules/25-configuration-and-environment.md`](../../../rules/25-configuration-and-environment.md)
- [x] Rollout / rollback documented (below)
- [x] Observability needs identified (recall summary + clamp + lane-failure logs — see
  [09-impact-analysis.md](09-impact-analysis.md))
- [x] Major risks identified ([08](08-architecture-review.md), [19](19-security-review.md))

## Branch / slice strategy

Single gate-green slice on `main`. Layer order within the slice: core primitive → per-step gate →
lane helpers/constants → recall service → generation-service `lane` param → module wiring →
style-match injection swap → config/env → tests. Every gate green before hand-off.

## Flags & config

- Master flag `AI_PARALLEL_PIPELINE_ENABLED` defaults **false** — shipping is behavior-neutral.
- Five tuning caps defaulted with bounds; invalid overrides fail fast at boot via zod.
- `.env` and [`.env.example`](../../../.env.example) updated in the same stream; fixture defaults
  added to [`stubs.ts`](../../../apps/api/src/tests/fixtures/stubs.ts).

## Migration / rollback

- No data migration (no database). Rollback is instantaneous: set the flag to `false` (or leave it
  unset) and recall reverts to the single unchanged call. No redeploy of contracts needed since the
  SSE and shared contracts are untouched.

## Observability plan

- `info`: one line per parallel recall (`N lane(s), K succeeded, M merged`).
- `warn`: lane-count clamp by budget; each failed/timed-out lane (error **type** only).
- No new dashboards or alerts required while the flag is off by default; the operator owns
  turn-on-time monitoring (call volume / cost) when enabling it — see the release-cycle note in the
  [README](README.md).

## Review & release readiness

- Reviewable, scoped diff (backend only; no frontend, no shared contract).
- Phases 17–27 (independent QA, UAT, client approval, go/no-go, release, hypercare, retrospective)
  are **not applicable to this code-complete, flag-off-by-default delivery; owned by the operator**
  at turn-on time.

## Open readiness gaps

None blocking. Fleet-wide concurrency bounding is explicitly out of scope
([ADR-003](../../../architecture/adrs/adr-003-horizontal-scaling-plan.md)).
