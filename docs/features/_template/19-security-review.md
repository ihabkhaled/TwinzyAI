# 19 - Security Review

## Purpose

Record security validation, controls, findings, and approval status.

Review against `docs/sdlc/security-baseline.md` and the rule files it cites (`rules/06-security.md`, `rules/14-ai-safety.md`, `rules/15-file-upload-security.md`).

## Review Checklist

### Access and Abuse Controls

- [ ] Consent enforcement reviewed (400 `CONSENT_REQUIRED` before any file processing)
- [ ] Rate limiting reviewed for the changed paths
- [ ] CORS and security headers (Helmet) unaffected or intentionally changed
- [ ] Denial cases tested (missing consent, oversize, wrong type, multiple files)

### Privacy and AI Safety

- [ ] No image persistence introduced (memory only; no volumes, no cache, no debug dumps)
- [ ] Image reaches only the trait-extraction prompt; candidate/judge prompts remain text-only
- [ ] No biometric/identity framing in code, prompts, or copy
- [ ] Forbidden-wording safety filtering intact; AI responses zod-validated
- [ ] Logging leakage reviewed (no image bytes, base64, secrets, or provider internals in logs)

### Application Security

- [ ] Input validation reviewed (zod at every trust boundary)
- [ ] Output handling reviewed (`ApiErrorResponse` envelope only; no stack traces to clients)
- [ ] Upload security chain reviewed end-to-end, order preserved; ClamAV fails closed
- [ ] Dependency risk reviewed (`npm run security:scan` clean — 0 HIGH/CRITICAL)

### Operational Security

- [ ] Secrets handling reviewed (`process.env` only in config modules; `GEMINI_API_KEY` never exposed)
- [ ] CI/CD and hook integrity reviewed (no `--no-verify`, no weakened gates)
- [ ] Deployment safety reviewed (ports, no new volumes on the api service)
- [ ] Security-relevant log events reviewed (rejections, scan failures, unsafe AI responses)

## Findings

| Finding ID | Severity | Description | Owner | Status |
| --- | --- | --- | --- | --- |
| | | | | open |

## Waivers

| Waiver ID | Risk | Approver | Expiration | Controls |
| --- | --- | --- | --- | --- |
| | | | | |

## Security Decision

- Decision: approve / reject / approve with conditions
- Reviewer:
- Date:

## Evidence And References To Attach

- findings list
- remediation references
- scan or validation outputs where relevant
- waiver approvals where relevant

## Phase Blockers

Do not close this phase if:

- critical or high-risk issues remain unresolved without waiver
- review scope is unclear
- conditions of approval are not explicit
- remediation ownership is missing
