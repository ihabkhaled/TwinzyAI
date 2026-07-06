# 08 — Security Review

> Run against the finished code by a frontend security reviewer (see [agents/README.md](../../../agents/README.md)) or a human reviewer following [skills/security-review.md](../../../skills/security-review.md). Norms are defined in [rules/06-security.md](../../../rules/06-security.md) and [docs/sdlc/security-baseline.md](../../sdlc/security-baseline.md). Twinzy-specific upload and AI-safety constraints are in [rules/15-file-upload-security.md](../../../rules/15-file-upload-security.md) and [rules/14-ai-safety.md](../../../rules/14-ai-safety.md).

## Review scope

- **Code reviewed:** <branch/commit>
- **Reviewer:** <name / agent>
- **Date:** <YYYY-MM-DD>

## Checklist (from skills/security-review.md)

### Injection and rendering

- [ ] No `dangerouslySetInnerHTML` introduced anywhere. <Confirm — the repo baseline is zero occurrences.>
- [ ] No user-controlled content interpolated into URLs, attributes, or scripts without validation. <Findings.>
- [ ] External links validated with `isSafeExternalUrl` (apps/web/src/shared/security/external-url.helper.ts) and rendered via `ExternalLink` (apps/web/src/packages/link) with safe rel attributes. <Findings.>

### CSP and headers

- [ ] Feature introduces no inline scripts/styles that would violate the per-request nonce CSP in apps/web/src/proxy.ts (`script-src 'self' 'nonce-…' 'strict-dynamic'`). <Findings.>
- [ ] No changes weaken the static headers in apps/web/next.config.ts (nosniff, DENY, referrer-policy, permissions-policy, COOP, HSTS). <Confirm.>

### Secrets and environment

- [ ] No `process.env` reads outside the env wrapper ([docs/eslint/no-process-env-outside-config.md](../../eslint/no-process-env-outside-config.md)); server-only values only via `getServerEnv` from '@/packages/env/server' (server-only guarded). <Findings.>
- [ ] No secrets, tokens, or internal hostnames in client bundles, fixtures, or test data. <Findings.>

### Network and data flow

- [ ] All requests go same-origin through the BFF gateway (`/api/gateway/[...path]` + `buildGatewayPath`); no direct browser calls to external hosts. <Findings.>
- [ ] **Twinzy image handling.** Any uploaded image is sent once through the gateway and never written to a store, the query cache, storage, logs, or analytics; it is released after the request. Upload requires the explicit consent flag; client-side size/MIME checks are UX-only and the server re-verifies authoritatively (rules/15-file-upload-security.md). <Findings.>
- [ ] **Twinzy AI-safety copy.** Any result/disclaimer text renders only vetted "playful style/vibe match" wording — no identity, face-match, or biometric claims (rules/14-ai-safety.md). <Findings.>
- [ ] Responses validated with Zod schemas before use; unexpected shapes fail via `parseSchema`/`safeParseSchema`. <Findings.>

### Error handling and information exposure

- [ ] Errors surface to users only as message keys via `mapErrorToMessageKey` / ERROR_MESSAGE_KEYS — no raw upstream messages or stack traces rendered. <Findings.>
- [ ] Logging via `appLogger` (apps/web/src/packages/logger) does not emit sensitive payloads or any image data. <Findings.>

### Dependencies

- [ ] `npm run security:audit` clean. <Output summary.>
- [ ] `npm run security:scan` (Trivy vuln + secret + misconfig) clean. <Output summary.>
- [ ] Any new dependency has a wrapper and a rationale in memory/library-boundaries.md. <Findings.>

## Findings register

| #   | Severity                   | Finding   | Resolution                                                   |
| --- | -------------------------- | --------- | ------------------------------------------------------------ |
| 1   | <critical/high/medium/low> | <finding> | <fixed in <commit> / accepted via docs/exceptions/<file>.md> |

## Gate

- [ ] No unresolved critical or high finding
- [ ] Audit and scan outputs attached or summarized
- [ ] Accepted risks documented as exceptions

**Signed off by:** <name> — <YYYY-MM-DD>
