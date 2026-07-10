# Exceptions Register

This directory records dated repository-level tool false positives, accepted third-party
vulnerabilities, and external constraints with compensating controls. It never authorizes inline
`eslint-disable`, `@ts-ignore`, `@ts-expect-error`, skipped required tests, lowered thresholds, or
hook bypasses; those are forbidden without exception.

> Scope: root [`CLAUDE.md`](../../CLAUDE.md) always wins. Static-rule configuration decisions are
> also documented in [docs/eslint-architecture.md](../eslint-architecture.md).

## The contract

Every exception MUST be filed from [exception-template.md](./exception-template.md) and MUST carry:

- **Owner** — a named person accountable for the exception's continued existence.
- **Expiry** — a date on which the exception is re-justified or removed. "Permanent" is allowed
  only when the safer alternative is structurally impossible, and even then it is re-reviewed at
  every framework-tier upgrade.
- **Reason** — the concrete failure the gate produces here, not "the rule is annoying".
- **Safer alternative considered** — what was tried or evaluated first, and why it lost.
- **Mitigation** — the compensating control that covers the risk the gate would have covered.

The owning configuration or risk artifact references the decision record without adding source
suppression directives. The release checklist audits expiry dates on every release
([docs/sdlc/release-checklist.md](../sdlc/release-checklist.md)); an expired exception blocks
release.

## What requires an exception

| Decision | Required evidence |
| --- | --- |
| Repository rule disabled for a proven tool false positive | Minimal reproducer, narrow scope, compensating control, owner, expiry |
| Accepted third-party vulnerability/audit filter | Upstream issue, exposure analysis, mitigation, owner, expiry |
| Framework-bound fallback copy outside i18n runtime | Proven unavailable runtime, single owner, a11y/security review |

## Currently active exceptions

> Seed exceptions carried from the frontend-OS baseline, adapted to `apps/web` paths. Each is
> re-confirmed against the actual `apps/web` code as the migration lands; remove any that no
> longer apply.

### EXC-0001 — `sonarjs/no-hardcoded-passwords` off

- **Where**: `eslint/sonar.config.mjs` (rule set to `'off'`).
- **Reason**: the rule cannot distinguish i18n keys, test ids, and form field ids that mention
  "password"/"secret" from real credentials; in this codebase every hit was a false positive.
- **Mitigation / ownership**: secret detection is owned by the Trivy secret scanner
  (`npm run security:scan`) locally and in the security CI workflow.

### EXC-0002 — `security/detect-object-injection` off

- **Where**: `eslint/security.config.mjs` (rule set to `'off'`).
- **Reason**: flags every computed property access; near-100% false positives in strictly typed
  code.
- **Mitigation / ownership**: object-injection risk is controlled by TypeScript strictness
  (`noPropertyAccessFromIndexSignature`, `noUncheckedIndexedAccess`) and Zod-validated boundaries
  via `parseSchema` from `@/packages/zod`.

### EXC-0003 — English fallback copy in the global error boundary

- **Where**: `apps/web/src/shared/constants/fallback-copy.constants.ts` (`FALLBACK_ERROR_COPY`),
  consumed by `apps/web/src/app/global-error.tsx`.
- **Reason**: `global-error.tsx` renders when the app shell — including the next-intl provider —
  has crashed; there is no i18n runtime left to translate with. This is the single exception to
  the "all copy is translated" rule ([rules/12-i18n.md](../../rules/12-i18n.md)).
- **Mitigation**: copy is confined to one `as const` constant with three keys (title, description,
  retry); no other file may import untranslated copy.

### EXC-0004 — resolver cast in the forms wrapper (superseded)

- **Status**: superseded 2026-07-09. The unused forms wrapper and dependencies were deleted in the
  Simple Code cleanup; no cast or exception remains.

## Lifecycle

1. File the doc from the template with a new `EXC-NNNN` id and get architect/security approval in
   the same PR as the repository-level configuration or risk decision.
2. Add the register entry above.
3. On expiry: remove the suppression, or re-justify with a new expiry and a note on why removal is
   still blocked.
4. When removed: mark the doc superseded (do not delete) and record the lesson in
   [memory/known-pitfalls.md](../../memory/known-pitfalls.md) if it generalizes.
