# 10 — Engineering Standards Check

- Standards frozen for this request: rules/00 (merged non-negotiables), architecture-map, zero-inline policy, vendor ownership map, no TS enum, zod-only validation, tests-first, coverage 95/90/95/95 on gated files, conventional commits, never bypass hooks.
- Request-specific rules: apps/web untouched; root config changes additive; public API byte-compatible; image-privacy invariants re-tested per slice.
- Permanent-rule updates expected: yes - recorded in rules/, memory/known-pitfalls.md, claude.md as discovered (retrospective lists them).
