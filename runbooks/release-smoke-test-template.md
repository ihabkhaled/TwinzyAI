# Release Smoke Test Template

## Scope

[Describe the critical flows that must be checked immediately after this specific deploy. The standing baseline every release runs is [`release-smoke-test.md`](./release-smoke-test.md); add release-specific checks here.]

## Smoke Tests

| Test | Expected result | Result |
| --- | --- | --- |
| `GET /api/v1/health` | 200, `x-content-type-options: nosniff` header present | pass / fail |
| `POST /api/v1/game/analyze` happy path (fixture image + consent) | 200, valid result payload | pass / fail |
| [Release-specific test] | | pass / fail |

## Operational Checks

- Logs: structured pino JSON flowing; request ids present; 4xx as `warn`, 5xx as `error`; nothing sensitive logged
- Error envelopes: spot-check one 4xx — `ApiErrorResponse` shape with error code / message key
- Integrations: AI provider reachable (or degraded path behaving as designed)
- Rollback: release slice still cleanly revertible
