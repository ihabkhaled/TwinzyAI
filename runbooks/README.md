# Runbooks — Twinzy

Operational procedures an engineer or on-call owner can execute during release, incident response, rollback, recovery, or degraded service for the Twinzy stack (Docker Compose: `api` on 4000, `web` on 3000, optional `clamav` profile on 3310).

## Concrete runbooks

| Runbook | When to use |
| --- | --- |
| [`api-outage.md`](./api-outage.md) | The API is down or unresponsive |
| [`ai-provider-outage.md`](./ai-provider-outage.md) | Gemini timeouts / 5xx — analyze flow failing with 502 |
| [`release-smoke-test.md`](./release-smoke-test.md) | Post-deploy verification of every release |
|| [`secret-rotation.md`](./secret-rotation.md) | A secret has been exposed or needs routine rotation |

## Templates

| Template | Purpose |
| --- | --- |
| [`incident-response-template.md`](./incident-response-template.md) | Start a new incident runbook |
| [`rollback-template.md`](./rollback-template.md) | Document a rollback procedure |
| [`release-smoke-test-template.md`](./release-smoke-test-template.md) | Define smoke tests for a specific release |

Ground truth for operations: structured pino JSON logs with request-id correlation (4xx log as `warn`, 5xx as `error`), the `ApiErrorResponse` envelope, and no database — rollback is always `git revert` + redeploy. Escalation and severity rules: [`docs/sdlc/company-sdlc-policy.md`](../docs/sdlc/company-sdlc-policy.md).
