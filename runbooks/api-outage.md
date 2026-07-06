# Runbook — API Outage

## Trigger

The Twinzy API is down or unresponsive: `GET /api/v1/health` fails or times out, the web app shows connection errors on analyze, or the `api` container is restarting/exited.

Severity: `SEV-1` (the analyze flow is the product). Assign an incident owner immediately.

## 1. Confirm the outage

```bash
# Container status — is api up, restarting, or exited?
docker compose ps

# Health probe (from the host)
curl -i http://localhost:4000/api/v1/health
```

Interpretation:

- `api` container `Up` + health 200 → not a full outage; go to log inspection (step 3) for partial failure.
- `api` container `Restarting`/`Exited` → boot failure; go to step 2.
- `Up` but connection refused/timeout → port/binding or hang; inspect logs, then restart (step 4).

## 2. Boot failures (container restarting or exited)

```bash
docker compose logs --tail=200 api
```

Config is validated fail-fast at startup — a misconfigured service refuses to boot rather than limping. Look for a fatal bootstrap/config error naming the offending variable, then check `.env`:

- `GEMINI_API_KEY` — present and non-empty
- `GEMINI_MODEL` — present (comes from `.env` by policy, never hardcoded)
- `GEMINI_TIMEOUT_MS`, `MAX_IMAGE_SIZE_BYTES` — numeric and sane
- `CORS_ALLOWED_ORIGINS` — valid origin list
- `ENABLE_CLAMAV` / ClamAV reachability — if enabled, the `clamav` profile service must be up (scanning fails closed by design; a dead scanner rejects uploads, it does not crash the API)

Fix the variable, then `docker compose up -d --build api`.

## 3. Log inspection (pino, structured JSON)

```bash
docker compose logs -f api
# or, while iterating:
npm run docker:logs
```

The API logs structured pino JSON, one object per line. How to read it:

- **Request-id correlation:** every request carries an id (`req.id`, honoring the `x-request-id` header when supplied). Grab the id from one failing response or log line and filter for it to see the request's whole lifecycle:

  ```bash
  docker compose logs api | grep '"<request-id>"'
  ```

- **Level mapping tells you who is at fault:**
  - `warn` entries = 4xx outcomes (client-side or expected rejections: `CONSENT_REQUIRED`, `FILE_TOO_LARGE`, `RATE_LIMITED`, ...) with their error code and `messageKey`. A spike in `warn` is not an API outage — it is a client, copy, or abuse problem.
  - `error` entries = 5xx outcomes with stack traces. These are the outage signal. Sustained `error` entries mean a real defect or a dead dependency.
- If `error` entries all point at the AI provider (`AI_PROVIDER_UNAVAILABLE`, `AI_TIMEOUT`, `errors.ai.*` message keys), switch to [`ai-provider-outage.md`](./ai-provider-outage.md) — the API itself is healthy.
- Nothing sensitive should appear in logs (no image bytes, no API keys). If it does, that is a separate `SEV-1` privacy incident — preserve evidence and escalate per [`docs/sdlc/security-baseline.md`](../docs/sdlc/security-baseline.md).

## 4. Recovery

1. Preserve evidence first: `docker compose logs api > api-outage-$(date +%Y%m%d-%H%M).log`
2. Restart the service: `docker compose restart api` (or `docker compose up -d --build api` if the image is suspect).
3. Re-probe: `curl -i http://localhost:4000/api/v1/health` → expect 200 and `x-content-type-options: nosniff`.
4. Exercise the real path once (analyze happy path — see [`release-smoke-test.md`](./release-smoke-test.md) step 3).
5. If the outage started with a recent release, roll back: `git revert` the release slice + `docker compose up -d --build` ([`rollback-template.md`](./rollback-template.md)). There are no DB migrations to unwind — code-level revert is always sufficient.

## 5. Exit criteria

- [ ] Health endpoint returns 200 with security headers
- [ ] Analyze happy path succeeds
- [ ] Logs show normal pattern (4xx→`warn` only where expected, no recurring `error` entries)
- [ ] Evidence preserved and incident notes written
- [ ] Postmortem opened if player impact was material (`27-postmortem.md` in the request folder)

## Escalation

- Owner of the release slice (see the request's `25-release-report.md`)
- Security/privacy contact if any leak is suspected
- Provider status if AI-related: hand off to [`ai-provider-outage.md`](./ai-provider-outage.md)
