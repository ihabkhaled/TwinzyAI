# 19 — Threat Model

## Scope and assets

Assets: uploaded image bytes, derived written traits/results, temporary share URLs/results, provider
keys/routes, localized user-facing output, and repository policy/gates.

## Trust boundaries

Browser → Fastify multipart/JSON boundary → application use cases → AI provider adapter; result →
optional in-memory share cache → public UUID page. Config and CI/tooling are separate operator
boundaries.

## Threats and mitigations

| Threat / abuse case | Mitigation |
| --- | --- |
| Photo processed without consent | Consent multipart field must be valid and precede file buffering |
| Photo leaks to generation/judge/translation/shadow/other provider | Downstream types have no image; static rule; extraction Gemini-only; image shadows removed |
| Buffer retained after error/queue/disconnect | Parser, presenter, and use cases share zero-fill helper/finally cleanup |
| Malicious/truncated/oversized upload | One canonical field/file, transport/app caps, MIME/ext/magic/structural decode, optional fail-closed ClamAV |
| AI identity/sensitive/unsafe output | Zod contracts, safety flags, English/Arabic forbidden lists, every extraction evidence leaf scanned |
| Oversized/slow provider output | total + idle timeout, raw-response byte cap, route bounds/fallback limits |
| Translation changes structure or receives unsafe client content | strict request schema, pre-scan, recursive shape equality, canonical field restoration |
| Share payload carries image/unsafe/custom disclaimer | strict result schema, exact server disclaimer, forbidden/base64 signatures, byte/item/TTL caps |
| Share URL leaks in logs/caches | request URL redacted; response `private, no-store`; app logs omit id |
| CI/gate bypass or agent drift | warning-fatal lint, strict TS, tested architecture rules, Knip errors, format/dead/cycle CI, compact mirrors |

## Residual risks

- Structural image validation is not a full pixel decode library; bounded dimensions/magic/container
  checks and ClamAV mitigate, but a future decoder adapter may further reduce risk.
- Temporary shares are bearer URLs in one in-memory instance and may disappear on restart.
- Real provider quality/terms require owner UAT and operational review before production release.
