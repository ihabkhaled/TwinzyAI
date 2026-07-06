# Runbook — AI Provider Outage (Gemini)

## Trigger

The analyze flow fails while the API itself is healthy: players get "try again later" errors, and the API returns 502 envelopes for `POST /api/v1/game/analyze`. Root cause is the AI provider — timeouts, 5xx responses, quota exhaustion, or a bad model/config value.

Severity: usually `SEV-2` (the game is degraded, nothing is lost — see Mitigation). Escalate to `SEV-1` only if it coincides with a release (then suspect our change, not the provider).

## 1. Confirm it is the provider, not us

```bash
# API itself healthy?
curl -i http://localhost:3001/api/v1/health     # expect 200

# What are the errors?
docker compose logs --tail=300 api
```

Signature of a provider outage in the structured pino logs:

- 502 responses whose envelope carries the AI error codes (`AI_PROVIDER_UNAVAILABLE`, `AI_TIMEOUT`) — provider failures map to the integration-error path (502 `ApiErrorResponse`), never to a raw provider error reaching the client.
- The corresponding `messageKey` values are the `errors.ai.*` family. **Measure the rate**:

  ```bash
  docker compose logs --since 15m api | grep -c '"errors.ai.'
  ```

  A handful over hours = transient blips (expected; the client retries). A sustained rate over minutes = active outage.
- Distinguish the flavors:
  - `AI_TIMEOUT` / timeout-flavored `errors.ai.*` keys → provider slow or unreachable; check `GEMINI_TIMEOUT_MS` is sane (default 30000).
  - `AI_PROVIDER_UNAVAILABLE` → provider 5xx/quota/auth trouble.
  - `AI_RESPONSE_INVALID` / `AI_RESPONSE_UNSAFE` → provider is **up** but responses fail zod validation or the safety filter — that is a model-behavior problem, not an outage; treat as a defect and consider rolling back any recent prompt/model change.

## 2. Check configuration before blaming the provider

A misconfigured environment looks exactly like an outage:

- `GEMINI_API_KEY` — present, non-empty, not expired/revoked
- `GEMINI_MODEL` — set in `.env` (policy: never hardcoded); verify it names a model that still exists — a decommissioned or misspelled model id produces permanent provider errors
- `GEMINI_TIMEOUT_MS` — not accidentally set to something tiny
- If any value changed in the last release: that release is the incident; revert it

Also check the provider's public status page for a confirmed incident on their side.

## 3. Mitigation

- **Nothing is lost — by design.** Twinzy persists nothing: no queue, no stored jobs, no partial state. A failed analyze is a moment of player disappointment, not data loss. There is no backlog to drain and no cleanup to run after recovery.
- **Retry guidance:** the correct player action is simply to try again later; the frontend surfaces the friendly retry copy driven by the error envelope. Do not add server-side retry storms against a struggling provider — the request-scoped timeout and the 502 envelope are the designed degradation.
- **Do not** disable validation, lengthen timeouts dramatically, or swap `GEMINI_MODEL` to an unvetted model as a "quick fix" — model changes go through change control (prompt/safety behavior may differ).
- If the outage is long-lived, brief support with the known-issue wording ([`support/known-issues-template.md`](../support/known-issues-template.md)): the game is temporarily unable to analyze photos; no player data is affected because nothing is stored.

## 4. Recovery validation

1. `errors.ai.*` rate in logs returns to ~zero:

   ```bash
   docker compose logs --since 10m api | grep -c '"errors.ai.'
   ```

2. Analyze happy path succeeds with a fixture image ([`release-smoke-test.md`](./release-smoke-test.md) step 3).
3. Spot-check one recovered request end-to-end by request id (grep the id across log lines).

## 5. Exit criteria

- [ ] Analyze flow succeeding
- [ ] `errors.ai.*` / `AI_*` rate back to baseline
- [ ] Config values confirmed correct (`GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_TIMEOUT_MS`)
- [ ] Support un-briefed / known issue closed
- [ ] If our change caused it: rollback done and postmortem opened

## Escalation

- Provider status page / support for confirmed provider incidents
- Release owner if the timeline matches a deploy
- AI-safety review (`rules/14-ai-safety.md`) if `AI_RESPONSE_UNSAFE` rates rose — filter behavior changes are a security matter, not an ops tweak
