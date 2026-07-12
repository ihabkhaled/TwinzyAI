# 13 — Implementation Readiness: AI Knowledge Operating System

Recorded at implementation time (the program executed phases 00–13 as a continuous documented
stream in this folder; artifacts were compacted per the standard lane).

- **Branch strategy:** direct commits to `main` in logically split, hook-gated slices
  (compiler → knowledge plane → canonical backfill → policy sync → generated plane → CI/hooks
  → governance docs), per the owner's instruction to split commits and push.
- **Flags/config:** none at runtime. Dev-facing: 17 `knowledge:*` npm scripts.
- **Migrations:** none (no data, no schema). Rollback = `git revert` of the doc/tooling
  commits; the app is untouched.
- **Observability:** compiler prints per-step timings; `knowledge:report` summarizes findings;
  CI gate publishes drift/validate/benchmark results per push.
- **Review scaffolding:** every generated artifact carries a `GENERATED FILE` header and a
  recorded input set (`.ai/hashes/generated-from.json`); reviewers diff authored sources, not
  compiled output.
- **Readiness gaps accepted:** vitest unit project for classifier edge cases (follow-up);
  orphan-candidate review (34 docs); writer-flagged stale source comments (fast-lane cleanup).
