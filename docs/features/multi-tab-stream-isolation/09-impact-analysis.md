# 09 - Impact Analysis

## Affected systems

| System | Impact | Backward compatible? |
| --- | --- | --- |
| SSE analyze stream | Frames now carry an optional correlation envelope + status; admission control + cancellation added | Yes — bare frames still valid; existing frame handlers ignore unknown fields |
| Shared contract (`@twinzy/shared`) | New enum/schemas/constants (additive) | Yes — no existing export changed |
| Config / env | 6 new env vars with safe defaults | Yes — all defaulted; `.env`/`.env.example` updated together |
| AI adapter port | Stream methods gained an optional trailing `signal?` | Yes — optional; existing callers/fake unaffected |
| Frontend gateway/service/mutation | `analyzeImageStream(..)` gained a required `options` (requestId + signal) | Internal only — all call sites updated in the same change |
| Rate limiter / CORS / camera / model chain | Untouched | Yes — verified by existing tests still green |

## Migration / compatibility

- **No schema/data migration** — the game has no database; nothing persisted.
- **Config drift**: the 6 new caps are defaulted in `env.schema.ts`, so an un-updated `.env`
  still boots; `.env.example` documents them. Fail-fast Zod validation covers bad overrides.
- **Client/server skew**: a new client against an old server → frames lack the envelope → the
  client's `isMatchingStreamFrame` accepts them (backward compat). An old client against a new
  server → ignores the extra fields. Both directions safe.

## Team / ops impact

- **Support**: overload now surfaces a clear "busy, try again" message (en/ar) instead of a hang.
- **Observability**: new `warn` logs — rejected (over capacity / duplicate), reaped stale streams;
  correlation rides the existing pino `req.id`. No new dashboards required for this change.
- **DevOps**: 6 env vars to set in non-local environments (safe defaults exist). No new services,
  ports, or infra.

## Known limitation (explicit)

The `ConcurrencyLimiter` and `StreamRegistry` are **in-memory, per API instance**. In a
multi-instance deployment the caps apply per instance and a cancel only reaches the instance
holding the stream. Mitigation for horizontal scale (out of scope here): a shared store keyed by
streamId. Recorded in the service doc-comments and [08-architecture-review.md](08-architecture-review.md).

## Compliance / privacy

No new data collected or persisted. Correlation ids are random UUIDs (not identity, not derived
from the user or image). The image-wipe-in-`finally` invariant is preserved and now exercised on
the abort/cancel path. No change to consent, upload validation, or the safety filter.
