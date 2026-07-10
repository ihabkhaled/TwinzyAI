# 04 — Cross-Functional Refinement

## Participants

Product owner, engineering/architecture, QA, security/privacy, DevOps/release, support, and AI-agent maintainers (roles mapped for this owner-led repository).

## Findings by function

- Product: public copy and most rules promise written-traits-only matching; runtime drift must be corrected.
- Engineering: Simple Code OS owners already exist in rules 28–30, five consolidated cleanup skills, two practical docs, context ownership map, memory record, and agent mirrors. Extending them avoids the duplicate-file anti-pattern.
- Architecture: retain Controller → Use case → Service → Adapter and Component → Hook → Service → Gateway.
- QA: add exact provider-call boundary assertions and diagnose the 16 px result-state overflow by identifying the overflowing element, not weakening the assertion.
- Security/privacy: preserve consent, ordered upload checks, fail-closed scanning, no logs/persistence, and wipe-in-`finally`.
- DevOps: current lint baseline has six warnings; E2E CI has two deterministic 320 px failures.
- Support/docs: align stale visual-similarity-pivot wording with the latest stricter owner directive.

## Hidden work and integration points

AI step capability routing, benchmark behavior, fixtures, prompts, provider tests, public docs, and multi-provider route validation all encode which steps carry images. Playwright devtools/runtime configuration may affect the 16 px overflow.

## Decisions

1. Consolidate requested governance into existing canonical owners.
2. Reinstate extraction-only image routing across code, tests, prompts, docs, and config.
3. Fix lint warnings at their owner; no inline suppressions.
4. Preserve existing worktree cleanup and validate it.

## Open questions

Release/UAT approval remains outside implementation and will be recorded in later phase artifacts; it does not block local implementation and validation.
