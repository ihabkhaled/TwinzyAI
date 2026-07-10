# 10 — Engineering Standards Check

## Standards matrix

- Strict TypeScript: preserve all flags; no `any`, non-null assertions, or TS suppression.
- ESLint: 0 errors/0 warnings; no inline disable; no rule weakened to hide a finding.
- Declarations: no inline domain types/constants/schemas/maps in layer files; extend existing owners.
- Layering: thin controllers, focused services, use-case orchestration, vendor adapters only.
- Validation/errors/config/logging: Zod, typed `AppError`, typed config, redacted `AppLogger`.
- Frontend: pure TSX composition, thin hooks, wrapped HTTP/storage, i18n/RTL/a11y, size caps.
- Safety: extraction-only image use; text-only downstream AI; no identity/biometric/sensitive inference.
- Upload/privacy: consent-first ordered checks, fail-closed production scan, memory-only, wipe in `finally`.
- Tests/docs: tests first for behavior changes; touched-file coverage target 95/90/95/95; docs in same stream.

## Request-specific constraints

- Preserve all existing worktree changes and inspect before editing.
- Fix the 320 px overflow at the owner; do not loosen the assertion or hide arbitrary content overflow.
- Consolidate the requested rule/skill/doc list into existing owners where creating a parallel file would violate rule 29.
- Historical artifacts are not rewritten as if they never happened; canonical docs clearly supersede them.

## Permanent-rule update check

Simple readable code is already permanent policy in rules 28–30 and memory. The permanent privacy boundary is inconsistent only in `CLAUDE.md` and current runtime; this request aligns those sources with the stricter owner directive.

## Implementation constraints

No new dependency, no config flag, no schema migration, no test deletion, no opportunistic unrelated refactor.
