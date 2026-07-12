# Release Notes — AI Knowledge Operating System (2026-07-12)

**Audience:** operators, contributors, and AI coding agents. **Player-visible changes:** none
(no runtime code touched).

## What shipped

- **`.ai/` acceleration plane** (generated, committed): `BOOTSTRAP.md` (~1,300-token universal
  agent bootstrap), `HOT_MEMORY.md`, `QUICK_ROUTER.md`, `CURRENT_STATE.md`, 15 manifests,
  16 indexes, 26 context packs, 13 summaries, 6 relationship graphs, hash snapshots.
- **Context resolver**: `npm run knowledge:context -- --task="..."` → task type, delivery
  lane, pack, exact docs/source/tests/reviewers/validation in `.ai/local/current-context.md`
  (measured ~3ms; targets were 300ms p50 / 1s p95).
- **Knowledge compiler**: `scripts/knowledge/` (35 scripts) with `knowledge:build`,
  `:build:incremental`, `:validate`, `:benchmark`, `:report`, `:contradictions`, and more —
  deterministic, hash-triggered freshness, hard token budgets.
- **Risk-based delivery lanes** (fast/standard/critical) and **rules 31–36** as permanent
  policy; CLAUDE.md gains the Knowledge-OS section.
- **Canonical backfill**: structure/, product/, domain/, contracts/, operations/, incidents/,
  quality/, docs/ai/, expanded support/ + runbooks/ (150+ evidence-cited documents).
- **Policy reconciliation**: CLAUDE.md constraint #1, rules/00 rule 42, AGENTS.md, and all 12
  agent mirror files now state the recorded 2026-07-12 paywall supersession (env-gated PayPal
  Orders v2, free by default, LIVE not approved); `.env.example` price mirror + sandbox
  example reconciled.

## Operator notes

- Pre-push now also runs `npm run knowledge:validate` (~1s). CI gains `Gate - Knowledge`.
- Never edit `.ai/` by hand; edit `knowledge/` or the canonical docs and run
  `npm run knowledge:build` in the same commit.
- Rollback: revert the docs/tooling commits; the application is untouched.

## Known limitations / follow-ups

Open contradiction-registry items (paywall LIVE conditions, paywall artifact backfill);
progressive frontmatter adoption for legacy docs; orphan-candidate review; vitest unit project
for the classifier (behavioral coverage today = full-repo build + 21-task golden benchmark).
