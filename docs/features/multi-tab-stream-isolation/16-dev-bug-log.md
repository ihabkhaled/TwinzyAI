# 16 - Developer Bug Log

## Internal defect loop

An adversarial multi-agent review (5 dimensions — concurrency, resource-leaks, correctness,
security/privacy, frontend — each with per-finding adversarial verification) was run over the 13
core isolation files. Result: **4 dimensions clean, 1 confirmed defect**, fixed before sign-off.

| ID | Severity | Dimension | Status |
| --- | --- | --- | --- |
| BUG-1 | Medium | Correctness | Fixed + regression test |

### BUG-1 — server correlation-id acceptance looser than the client's `z.uuid()` contract

**Found by:** adversarial review (correctness finder), verified high-confidence against the
installed zod 4.4.3.

**Defect:** `resolveCorrelationId` (`apps/api/src/modules/game/lib/stream-correlation.ts`) kept a
caller-supplied id whenever it matched a hand-rolled regex that accepted **any** hex in the uuid
version/variant nibbles. The shared contract validates the frame envelope with `z.uuid()`, which
in zod 4 requires an RFC version nibble `[1-8]` and variant nibble `[89abAB]`. So the server's
acceptance was a strict superset of the client's validation.

**Failure scenario:** a non-browser client (curl/SDK/proxy) sends
`x-twinzy-request-id: 12345678-1234-1234-c234-1234567890ab` (8-4-4-4-12 hex, but variant nibble
`c` is not RFC). The server keeps it and stamps it on every SSE frame; the client parses each
frame with `GameStreamMessageSchema` (`z.uuid()`), which rejects the id, so **every** frame is
dropped and the run ends with "Stream ended without a result" — the server produced valid output
that the client silently discarded. This directly violated the function's own docstring
("so the shared contract's uuid validation on the client never rejects our own frames"). The
production browser client was immune (it mints valid v4 UUIDs via `crypto.randomUUID`), so
happy-path tests — which all used valid v4 UUIDs — could never have caught it.

**Root cause:** two independent uuid definitions (a hand-rolled server regex vs the shared
`z.uuid()`) that were free to diverge.

**Fix:** made both sides share one definition. Added `CorrelationIdSchema = z.uuid()` to
`packages/shared/src/schemas/game-stream.schema.ts`, used it for the envelope fields and the
cancel schema, and changed `resolveCorrelationId` to validate incoming ids with
`CorrelationIdSchema.safeParse(...)`. Now the server re-mints any id the client would reject, so
acceptance and validation can never diverge again.

**Regression test:** `game-stream-lib.test.ts` → "re-mints a hex-shaped but non-RFC id so the
client never rejects our frames" (feeds the exact `…-c234-…` value and asserts it is replaced).

**Retest:** full suite **554 tests green**; coverage 98.79/94.28/99.41/98.76; typecheck + lint +
production build clean.

## Stability decision

No open internal defects. Change is internally stable and ready for the documentation/sign-off
phase.
