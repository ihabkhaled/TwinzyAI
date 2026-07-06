# Skill: Observability Review

> Applies rules/22. Verdict is binary: a production failure can be reconstructed from the
> logs AND nothing sensitive escaped into any sink.

1. Single sink: `AppLogger` (nestjs-pino) is the only logger — no `console.*` anywhere in
   src/ (lint-enforced). Constant event-style messages plus structured fields; never
   interpolate objects, entities, or payloads into the message string.
2. Correlation: every log line of one request carries the same pino request id, and the id
   is returned to the client (request-id header) so a user report can be matched to the
   exact server trail. Confirm the id survives into every layer the change touches.
3. Levels are the alert signal: 4xx paths log `warn`, 5xx log `error` — verify the
   `core/errors` filter mapping; every `catch` logs before rethrow/fallback; no empty
   catch blocks.
4. Redaction — the leak hunt. NEVER in any log: image bytes or base64 payloads, prompt text
   containing user data, raw AI responses before validation/safety-filtering,
   `GEMINI_API_KEY` or any secret, full request bodies or headers. Log counts, durations,
   and ids — not payloads. Traits are non-identifying by design, but still log trait counts
   rather than trait dumps.
5. Envelope: clients receive the `ApiErrorResponse` fields + `messageKey` only; stacks and
   provider errors stay server-side (create-error.md).
6. Fail-safe: a logging or cleanup failure must never break the request (rules/08).
7. Tests: assert the failure path logs at `error` with safe fields, the success path at the
   expected level, and that a captured log dump contains no secret/byte payload.
8. Record new event names or redaction decisions in memory/security-decisions.md /
   memory/known-pitfalls.md.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
