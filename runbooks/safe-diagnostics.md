---
id: runbook-safe-diagnostics
title: Runbook — Safe Diagnostics
type: runbook
authority: canonical
status: current
owner: repository owner
summary: What you may and may not log, copy, or capture while debugging Twinzy — the debugging-time rules that keep diagnostics from becoming the leak.
keywords: [runbook, diagnostics, debugging, logging, redaction, privacy, secrets, evidence, log-level]
contextTier: 2
relatedCode:
  [
    apps/api/src/modules/privacy/lib/log-redaction.helpers.ts,
    apps/api/src/core/logger/logger.constants.ts,
    apps/api/src/core/validation/validation-exception.factory.ts,
  ]
relatedTests: [apps/api/src/modules/privacy/tests/log-redaction.helpers.test.ts]
relatedDocs: [support/evidence-collection.md, runbooks/accidental-image-exposure.md, docs/ai-safety.md]
readWhen: Before adding any diagnostic logging, capturing artifacts, or pasting anything from a live system into a ticket/chat.
---

# Runbook — Safe Diagnostics

The privacy design assumes diagnostics obey the same rules as production code. A debug session that copies image bytes or secrets into a ticket **is** the privacy incident ([accidental-image-exposure.md](./accidental-image-exposure.md)).

## You MAY freely use and share

- Request ids, tab ids, stream ids (opaque UUIDs — designed for correlation).
- `errorCode`, `messageKey`, HTTP statuses, stage names, timings, counts.
- The sanitized `ApiErrorResponse` envelope (built to be safe at the boundary — `apps/api/src/core/errors/error-body.mapper.ts`).
- Flattened validation issues — field paths + constraints, never submitted values (`apps/api/src/core/validation/validation-exception.factory.ts`).
- Synthetic fixtures: test images are byte-built, never real photos (`apps/api/src/tests/fixtures/image-fixtures.ts`; the smoke test explicitly forbids real-person photos, [release-smoke-test.md](./release-smoke-test.md)).

## You may NEVER log, copy, or capture

1. **Image bytes in any encoding** — no buffers, base64, data URIs, hex dumps, or "just the first KB". The redaction layer strips base64 runs from logs on purpose (`redactForLog`, `apps/api/src/modules/privacy/lib/log-redaction.helpers.ts`); don't route around it.
2. **Secrets** — API keys, PayPal credentials, tokens, `Authorization`/cookie headers (pino redacts these paths — `apps/api/src/core/logger/logger.constants.ts` — keep it that way in ad-hoc logging too).
3. **Raw provider request/response payloads** — provider error text is redacted before logging (`gemini.adapter.ts` uses `redactForLog`); full AI responses may embed user-derived text and must not land in tickets.
4. **Players' real photos as "repro material"** — reproduce with synthetic fixtures; if a player sends a photo unprompted, delete it ([`../support/evidence-collection.md`](../support/evidence-collection.md)).
5. **Share URLs from real players in public channels** — a live share id is a bearer token to the result until it expires (which is why `req.url` is in the pino redact list).

## Rules for temporary debug instrumentation

- Prefer turning up `LOG_LEVEL=debug` (env, `.env.example`) over adding new log lines; debug prompt logging is already gated to non-production (`apps/api/src/modules/ai/` per the module map).
- Any new log line goes through `AppLogger` and, for any value that could carry user-derived text, through `redactForLog` — the same rules as production because it *is* production code once committed.
- Never lower the redaction: `REDACT_PATHS`, the base64 pattern, and value caps are security controls, not verbosity settings.
- Temporary instrumentation is removed before merge — WIP/debug commits never reach protected branches (CLAUDE.md packaging rules); there is no `eslint-disable` escape hatch for "just debugging".

## Captured artifacts (logs, heap/CPU profiles)

- Log snapshots taken during incidents ([security-incident.md](./security-incident.md) §2) are sensitive: store them access-restricted, share excerpts (grep the relevant request id) rather than whole files, and destroy them when the investigation closes.
- Heap snapshots and CPU profiles may contain raw request memory **including image bytes** — capture them only from non-production runs with synthetic data where possible ([memory-growth.md](./memory-growth.md) §5), never attach them to tickets, and delete after analysis.

## Verify

Before closing any debugging session: no new un-reviewed log lines left behind (`git diff`), no artifacts in chat/tickets that violate the NEVER list, and `npm run security:scan:secrets` clean if anything env-related was touched.

## Rollback

Not applicable — this runbook constrains behavior; it performs no system change.
