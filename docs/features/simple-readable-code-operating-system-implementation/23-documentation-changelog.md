# 23 — Documentation Changelog

## Updated documentation groups

- Canonical governance/mirrors: `CLAUDE.md`, `AGENTS.md`, Cursor rule, all named model entrypoints.
- Engineering canon: rules 07/09/14/20/26/28/30, frontend rules/index, review/release guidance.
- Skills: simple cleanup/safety/final-validation/typecheck plus current form/large-list procedures.
- Context: architecture, AI flow, glossary, reference patterns, stack/toolchain, precedence index.
- Memory: simplicity, AI safety, privacy, architecture, known pitfalls, frontend supersession notes.
- Product/operations: README, AI/privacy/backend/provider/env/ESLint docs, release notes, support.
- Testing: root full-stack coverage allowlist/policy and warning/dead-code/circular CI gates.
- Historical feature records: supersession/current-implementation notes added without erasing history.
- Request record: complete 00–27 implementation trail under the owner-specified slug.
- Hydration regression follow-up: test strategy, validation evidence, defect logs, known pitfalls,
  and release notes record the theme-toggle fix.

## Why

Documentation now matches actual `modules/`/`packages/` structure, ESLint 10, native TS7 checker with
peer-compatible TS API, text-only post-extraction flow, prompt v5, 221/25/1–10 bounds, current test
boundary strategy, and real commands.

## Remaining gaps

Live UAT/client approval/release/hypercare evidence remains intentionally pending. Historical feature
artifacts retain old planning detail but carry supersession notes where it could mislead current work.
