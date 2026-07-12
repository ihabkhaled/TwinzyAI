---
id: structure-module-api-privacy
title: Module — api privacy (Log Redaction and No-Persistence Guarantee)
type: structure
authority: canonical
status: current
owner: repository owner
summary: The privacy module — LogRedactionService and the pure redactForLog helper that cap log values and replace base64 runs and secrets, embodying the no-persistence design.
keywords: [privacy, redaction, logs, secrets, base64, no-persistence, redactforlog]
contextTier: 2
relatedCode: [apps/api/src/modules/privacy]
relatedTests: [apps/api/src/modules/privacy/tests/log-redaction.helpers.test.ts, apps/api/src/modules/privacy/tests/log-redaction.service.test.ts]
relatedDocs: [docs/privacy-and-data-retention.md, structure/runtime-topology.md]
readWhen: You are logging anything near user data, provider errors, or secrets.
---

# Module — `apps/api/src/modules/privacy`

**Responsibility.** Log redaction and the codified no-persistence guarantee. The module doc
(`privacy.module.ts`) records: "Twinzy stores no user data by design — there is deliberately
no repository anywhere in this API."

## Public surface (`index.ts`)

`LogRedactionService` (DI wrapper), `redactForLog` (pure helper), `PrivacyModule`.

## Key files

| File | Role |
| --- | --- |
| `application/log-redaction.service.ts` | Injectable wrapper over the pure helper |
| `lib/log-redaction.helpers.ts` | `redactForLog`: caps values at `MAX_LOGGED_LENGTH` 500 chars; replaces base64 runs (`BASE64_RUN_PATTERN`, 64+ base64 chars — the signature of leaked image bytes) and `key|token|authorization` secrets (`SECRET_KEY_PATTERN`) with `[REDACTED]` |
| `model/privacy.constants.ts` | The patterns and limits above |

## Consumers

Imported by `AiModule` and `GameModule`; `GeminiAdapter` uses the pure helper directly for
provider error text (allowed by layer rules per the helper's doc comment). This module-level
redaction complements the transport-level pino redaction paths
(`apps/api/src/core/logger/logger.constants.ts`) — two layers, different scopes.

## Invariants

- No env keys, no errors, no events, no persistence.
- Redaction must stay ahead of what gets logged: provider errors, validation summaries, and
  anything that could carry image bytes route through `redactForLog` before logging.
- Weakening `BASE64_RUN_PATTERN` or `SECRET_KEY_PATTERN` risks leaking image bytes or
  credentials into logs — treat as a privacy/security review trigger
  ([docs/privacy-and-data-retention.md](../../docs/privacy-and-data-retention.md)).

## Tests

`apps/api/src/modules/privacy/tests/log-redaction.helpers.test.ts` and
`log-redaction.service.test.ts`. Scoped run: `npm run test:security` (covers
`modules/privacy` alongside `modules/file-security`).

## Common changes and risks

- **New secret shapes**: add to `SECRET_KEY_PATTERN` in `model/privacy.constants.ts` with a
  test in the helpers suite.
- **Risk (critical lane)**: this is the last line of defense between user data and log
  storage; changes here need security-aware review per [CLAUDE.md](../../CLAUDE.md).
