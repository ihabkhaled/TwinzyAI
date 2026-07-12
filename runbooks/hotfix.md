---
id: runbook-hotfix
title: Runbook — Hotfix
type: runbook
authority: canonical
status: current
owner: repository owner
summary: The hotfix track — compressed but never skipped phases, the minimum gate set, and the mandatory follow-up.
keywords: [runbook, hotfix, emergency, fast-track, gates, regression-test, retrospective]
contextTier: 2
relatedCode: [package.json]
relatedTests: []
relatedDocs: [docs/sdlc/company-sdlc-policy.md, runbooks/emergency-rollback.md, runbooks/deployment.md]
readWhen: A production-impacting defect needs a fix faster than the standard track.
---

# Runbook — Hotfix

Governing policy (CLAUDE.md Hotfix Rules): **hotfixes are faster, not looser** — all phases still exist, analysis may be compressed but not skipped, approvals accelerated but not erased, rollback readiness is even more important, and a retrospective is mandatory. If the situation is "make it stop *now*", start with [emergency-rollback.md](./emergency-rollback.md) — rolling back is usually faster and safer than fixing forward.

## Prerequisites

- Defect confirmed and reproduced; severity assigned ([`../support/escalation-matrix.md`](../support/escalation-matrix.md)).
- Decision recorded: fix-forward (this runbook) vs roll back first ([rollback.md](./rollback.md)).
- Hotfix-track intake noted in the owning feature folder (compressed 00-intake is still an artifact).

## Steps

1. **Branch** from `main` with the request id in the branch name (commit/branch rules, CLAUDE.md).
2. **Write the regression test first** — the exact failure mode, red before the fix. A critical bug fix is never split from its regression test (CLAUDE.md packaging rules).
3. **Fix at the root cause** — smallest reviewable change; no opportunistic refactors on the hotfix branch.
4. **Full local gates — none may be skipped, ever**:
   ```bash
   npm run lint && npm run typecheck && npm run test:unit
   npm run test:coverage && npm run build
   ```
   Husky hooks are never bypassed; `--no-verify` requires a written, approved emergency exception that names what was skipped and when it will be restored (CLAUDE.md local-gate rules).
5. **Review + CI**: PR with the compressed context (problem, scope, risk, evidence, rollback note); all seven CI gates green (`.github/workflows/gate-*.yml`).
6. **Deploy** per [deployment.md](./deployment.md) steps 2–4 (build, up, smoke test) — the smoke test is not optional on hotfixes.
7. **Watch**: a focused hypercare window on the fixed symptom ([hypercare.md](./hypercare.md)).

## Verify

- Regression test green in the suite; the live symptom gone; smoke test green; no new `error`-level log entries in the watch window.

## Rollback

The hotfix itself must be revertible in one step — same mechanics as any release ([rollback.md](./rollback.md)). If the hotfix worsens things, revert it immediately and return to the rollback posture.

## Mandatory follow-up (same week)

- Backfill the compressed artifacts in the owning feature folder (dev validation notes, defect log entry).
- Retrospective — mandatory for every hotfix; postmortem if player impact was material (`27-postmortem.md`).
- If the escape revealed a missing standing rule or test layer, update the owning standard (CLAUDE.md "When This File Must Be Updated").
