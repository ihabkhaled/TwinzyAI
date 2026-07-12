---
id: domain-state-machines
title: State Machines — Analyze Request and Share Lifecycles
type: domain
authority: canonical
status: current
owner: repository owner
summary: The analyze-request lifecycle (received through delivered/cancelled/failed, with SSE stage events) and the share-record lifecycle (created, live, expired, deleted).
keywords: [state-machine, lifecycle, sse, stages, stream-status, cancel, timeout, share, expiry, paywall]
contextTier: 2
relatedCode: [apps/api/src/modules/game/application/analyze-game-stream.use-case.ts, packages/shared/src/enums/game-stream.enum.ts, packages/shared/src/enums/stream-status.enum.ts, apps/api/src/modules/game/lib/game-stream.ts]
relatedTests: [apps/api/src/tests/game-analyze-stream.integration.test.ts, packages/shared/tests/stream-contract.test.ts, apps/api/src/modules/game/tests/game-stream-lib.test.ts]
relatedDocs: [domain/failure-semantics.md, domain/image-lifecycle.md, domain/sharing-lifecycle.md]
readWhen: You need the exact order of pipeline states, SSE stage events, or terminal outcomes for a run or a share.
---

# State Machines — Analyze Request and Share Lifecycles

## 1. Analyze request lifecycle

One run of `POST /api/v1/game/analyze[/stream]`. States below map 1:1 to code; the SSE
`stage` events are the observable milestones (`GameStreamStage`,
`packages/shared/src/enums/game-stream.enum.ts`).

```
received ──► admitted ──► validated ──► paid? ──► extracting ──► WIPED ──► matching ──► judging ──► aggregated ──► delivered
   │            │             │           │            │                      │            │
   └─ rejected  └─ rejected   └─ failed   └─ failed    └─ failed/cancelled ───┴────────────┴─ failed/cancelled (post-capture ⇒ refund)
```

| State | What happens | Code / SSE evidence |
| --- | --- | --- |
| **received** | SSE hijack, correlation ids resolved, `accepted` frame + `stage: validating` emitted | `apps/api/src/modules/game/api/game-stream.presenter.ts`; `analyze-game-stream.use-case.ts` lines 45–46 |
| **admitted** | Concurrency limiter admits (global/per-IP/per-tab caps, bounded FIFO queue); busy ⇒ in-band `ServerBusy` rejection, duplicate in-flight requestId rejected | `apps/api/src/core/streaming/concurrency-limiter.service.ts`; presenter |
| **validated** | `stage: scanning`; consent (first) then the full file-security chain | `analyze-game-stream.use-case.ts` lines 107–108; `apps/api/src/modules/file-security/application/file-security.service.ts` |
| **paid?** | Only when the paywall is env-enabled: `captureForAnalysis` verifies a PayPal capture between file security and the AI call; paywall off ⇒ no-op | `analyze-game-stream.use-case.ts` line 110; [policies.md](policies.md#paywall-gate-policy) |
| **extracting** | `stage: extracting-traits`; the ONLY image-facing step | `analyze-game-stream.use-case.ts` lines 112–117 |
| **WIPED** | The upload buffer is zero-filled in `finally` — reached on success, failure, and abort | `analyze-game-stream.use-case.ts` lines 118–120; [image-lifecycle.md](image-lifecycle.md) |
| **matching** | `traits` frame, then text-only candidate generation (`stage: generating-candidates`, `candidates` frame) | `analyze-game-stream.use-case.ts` lines 72–92; `apps/api/src/modules/game/application/style-match.service.ts` |
| **judging** | `stage: judging`; strict text-only re-scoring | `style-match.service.ts` |
| **aggregated** | `stage: aggregating`; display gate, re-rank, cap, server disclaimer | `apps/api/src/modules/result-aggregation/` |
| **delivered** | `result` frame with the full `FinalGameResult`; stream status `completed` | presenter + `packages/shared/src/schemas/game-stream.schema.ts` |

### Terminal outcomes

`StreamStatus` (`packages/shared/src/enums/stream-status.enum.ts`) is stamped on every frame;
terminal values are `completed`, `failed`, `cancelled`, `rejected`
(`TERMINAL_STREAM_STATUS_VALUES`). Termination classification lives in
`apps/api/src/modules/game/lib/game-stream.ts` (`resolveStreamTermination`):

- **cancelled** — explicit `POST /api/v1/game/cancel` with exact streamId+tabId+requestId
  match ⇒ `ANALYSIS_CANCELLED` error frame, status `cancelled`.
- **failed (timeout)** — watchdog abort at `ANALYSIS_TIMEOUT_MS` ⇒ `AI_TIMEOUT` frame.
- **disconnect** — client gone; abort propagated, terminal frame suppressed.
- **rejected** — overload/back-pressure refusal before the run started (`ServerBusy`,
  duplicate request).
- **failed (any error)** — mapped through the same error envelope as JSON responses
  ([failure-semantics.md](failure-semantics.md)).

Any failure **after** payment capture (including cancel/timeout/disconnect) refunds the
undelivered run (`analyze-game-stream.use-case.ts` lines 61–66). Orphaned streams are swept
after `STREAM_TTL_MS` (`apps/api/src/core/streaming/stream-registry.service.ts`).

Note: keep-alive on the wire is an SSE **comment** every 10 s
(`apps/api/src/modules/game/api/game-stream.presenter.ts`, lines 111–113); the `heartbeat`
event exists in the schema but is not currently emitted as an event frame.

## 2. Share lifecycle

Owned in detail by [sharing-lifecycle.md](sharing-lifecycle.md). Summary:

```
created ──► live ──► expired (lazy + 30s sweep)
              │
              └────► deleted (idempotent DELETE, always 204)
```

- **created** — payload re-validated as untrusted, CSPRNG UUID minted, expiry computed from
  the server clock (`apps/api/src/modules/share-results/application/create-share-result.use-case.ts`).
- **live** — readable while unexpired; `remainingSeconds` always derived from the server
  clock (`get-share-result.use-case.ts`).
- **expired / missing** — indistinguishable: the same 404 (`get-share-result.use-case.ts`).
- **deleted** — idempotent; records also vanish on process restart (in-memory driver,
  `infrastructure/in-memory-share-result-cache.repository.ts`).

## 3. Translation is not a state machine

`POST /api/v1/game/translate-result` is a single stateless request over an existing
`FinalGameResult` — no stream, no stages, no image slot by construction
(`packages/shared/src/schemas/translate-result.schema.ts`). See
[language-lifecycle.md](language-lifecycle.md).
