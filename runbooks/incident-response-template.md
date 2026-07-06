# Incident Response Runbook Template

## Trigger

[Describe the incident condition that activates this runbook — e.g. health check failing, sustained 5xx `error` log entries, analyze flow down, privacy/AI-safety violation suspected.]

## Immediate Actions

1. Stabilize player impact.
2. Assign incident owner.
3. Preserve evidence: capture `docker compose logs api` output and the relevant request ids before restarting anything.
4. Assess rollback (`git revert` + redeploy — see [`rollback-template.md`](./rollback-template.md)) or containment options.
5. If the incident involves image persistence, biometric behavior, or forbidden wording reaching players, treat it as `SEV-1` regardless of traffic impact.

## Diagnostics

- Container status: `docker compose ps`
- Health: `curl -i http://localhost:4000/api/v1/health`
- Key logs: `docker compose logs -f api` — structured pino JSON; filter by `req.id` to follow one request; 4xx appear as `warn` with an error code / message key, 5xx as `error` with stack
- Env/config: verify `.env` values the change depends on (`GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_TIMEOUT_MS`, `MAX_IMAGE_SIZE_BYTES`, `CORS_ALLOWED_ORIGINS`, `ENABLE_CLAMAV`)

## Escalation

- Primary on-call:
- Secondary on-call:
- Business contact:
- Security/privacy contact:

## Recovery Steps

1. [Step 1]
2. [Step 2]

## Exit Criteria

- [ ] Service stabilized (health 200, analyze flow working, error rate normal)
- [ ] Communications sent
- [ ] Postmortem opened if required (`docs/features/<feature-slug>/27-postmortem.md`)
