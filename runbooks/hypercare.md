---
id: runbook-hypercare
title: Runbook — Hypercare
type: runbook
authority: canonical
status: current
owner: repository owner
summary: Operating the post-release hypercare window — signals to watch with the observability that exists, actions, and how the window closes.
keywords: [runbook, hypercare, post-release, monitoring, signals, logs, window, closure]
contextTier: 2
relatedCode: [apps/api/src/core/logger/http-logging.options.ts]
relatedTests: []
relatedDocs:
  [
    docs/features/_template/26-hypercare-report.md,
    runbooks/release-smoke-test.md,
    support/release-support-checklist.md,
  ]
readWhen: A release just shipped, or an incident fix needs a supervised observation window.
---

# Runbook — Hypercare

Hypercare is a planned operating window with an owner, duration, and success criteria (CLAUDE.md Hypercare Rules); its record is the release's `26-hypercare-report.md` (template: `docs/features/_template/`).

## Prerequisites

- Release deployed and smoke test green ([release-smoke-test.md](./release-smoke-test.md)); rollback still armed ([rollback.md](./rollback.md)).
- Window declared up front: owner (repository owner by default), duration, and the success criteria for closing it.
- Support briefed ([`../support/release-support-checklist.md`](../support/release-support-checklist.md)).

## Signals to watch (with the tooling that exists — structured pino logs, no APM)

Run periodically through the window:

```bash
# 5xx / defect signal — should stay at ~zero
docker compose logs --since 30m api | grep -c '"level":50'      # error-level entries

# AI degradation signal
docker compose logs --since 30m api | grep -c '"errors.ai.'

# Overload / throttle signals
docker compose logs --since 30m api | grep -c '"SERVER_BUSY"'
docker compose logs --since 30m api | grep -c '"RATE_LIMITED"'

# Container health & resources
docker compose ps
docker stats --no-stream
```

Interpretation baseline: 4xx log as `warn` (expected rejections — a spike is a client/copy/abuse question), 5xx as `error` (the defect signal) (`apps/api/src/core/logger/http-logging.options.ts`; reading guide in [api-outage.md](./api-outage.md) §3). Plus the human channel: support ticket themes against [`../support/known-issues.md`](../support/known-issues.md).

Release-specific signals: watch whatever the release touched — e.g. `VIRUS_SCAN_FAILED` counts after upload changes, `errors.share.*` after share changes, payment codes after paywall changes.

## Actions during the window

| Observation | Action |
| --- | --- |
| Sustained `error`-level entries tied to the release | Roll back ([rollback.md](./rollback.md)) — rollback triggers were defined before release; honor them |
| Provider-flavored failures | [provider-outage.md](./provider-outage.md) — usually not the release's fault, verify timeline |
| Novel player-facing misbehavior, tolerable severity | Known-issue entry + defect ticket; hotfix if it worsens ([hotfix.md](./hotfix.md)) |
| Privacy/safety-flavored anything | Immediate SEV-1 path ([privacy-incident.md](./privacy-incident.md)) — hypercare never downgrades safety |

## Verify (window closure criteria)

- [ ] Error-level rate at baseline for the full window
- [ ] No open blocking defects from the release
- [ ] Support ticket volume/themes normal; known-issue entries resolved or accepted
- [ ] `26-hypercare-report.md` filled: window, observed signals, actions taken, conclusion, follow-ups

## Rollback

Remains available for the entire window — that is the point of the window. After closure, rollback shifts from "armed" to normal change management.
