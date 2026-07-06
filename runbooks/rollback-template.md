# Rollback Runbook Template

## Trigger

[Describe the release symptom or threshold that triggers rollback — e.g. smoke test failure, sustained 5xx rate, privacy/AI-safety regression.]

## Preconditions

- [Precondition 1 — e.g. the release slice is identified as one or more revertible commits]
- Twinzy has no database: there are never data migrations to unwind. Rollback is always code-level — `git revert` + rebuild + redeploy.

## Rollback Steps

1. Identify the commit(s) of the release slice (`git log --oneline`).
2. `git revert <sha>...` (revert the slice; never force-push, never bypass hooks).
3. Rebuild and redeploy: `docker compose up -d --build`.
4. [Release-specific step, e.g. restore a changed `.env` value]

## Validation After Rollback

- [ ] Critical path works: run [`release-smoke-test.md`](./release-smoke-test.md) against the rolled-back build
- [ ] `GET /api/v1/health` returns 200 with security headers
- [ ] Analyze happy path succeeds with a fixture image
- [ ] Logs stabilized (no unexplained `error` entries)
- [ ] Player impact reduced
