# 09 — Impact Analysis: AI Knowledge Operating System

## Blast radius (all reviewed)

| Area | Impact |
| --- | --- |
| Runtime (`apps/*`, `packages/shared`) | **None** — zero source changes |
| npm scripts | +17 `knowledge:*` commands (root package.json) |
| Dependencies | +`yaml` (dev-only, wrapped) — docs/package-decisions.md |
| ESLint | documented relaxation blocks for `scripts/knowledge` (security-plugin false-positive families; child-process for `lib/git.mjs`); nothing weakened for app code |
| Husky | pre-push += `npm run knowledge:validate` (~1s); pre-commit untouched |
| CI | new `gate-knowledge.yml` (rebuild → drift check → validate → benchmark → report) |
| knip | root project now includes `scripts/**/*.mjs` |
| Prettier/git ignore | `.ai` prettier-ignored (byte-stable compiler output); `.ai/local/*` gitignored |
| Policy texts | CLAUDE.md (constraint #1 + new knowledge-OS section + repo structure), rules/00 rule 42, rules/README, AGENTS.md, 8 model mirrors, CODEX.md, cursor.md, .cursorrules, .cursor/rules/non-negotiables.mdc — all aligned to the recorded 2026-07-12 paywall supersession and the fast-task protocol |
| `.env.example` | price mirror reconciled (0.50/0.50), `PAYPAL_ENV=sandbox` example, stale "paid gating forbidden" comment corrected. Local `.env` deliberately untouched: no new keys were added and the owner's runtime values are not ours to change |
| New canonical dirs | structure/ product/ domain/ contracts/ operations/ incidents/ quality/ docs/ai/ + expanded support/ runbooks/ knowledge/summaries — additive |
| Backward compatibility | full — existing docs/links untouched except cited fixes; legacy docs adopt frontmatter progressively |

## Compatibility and operations

- A fresh clone works without a build (`.ai/` committed); `npm run knowledge:build` restores
  everything deterministically.
- Failure modes: stale `.ai/` → pre-push/CI fail with an actionable message; budget overrun →
  build fails naming the file and token counts; broken strict link/reference → validate fails
  with the exact doc and target.
- Support/training impact: `skills/resolve-task-context.md` + `knowledge/README.md` are the
  onboarding surface; every agent bootstrap file now points at `.ai/BOOTSTRAP.md` first.

## Known follow-ups (recorded, not hidden)

- Open contradiction-registry items: `paywall-live-conditions` (owner), `paywall-artifact-debt`
  (backfill or waiver), plus `paywall-policy-supersession` closable once this stream merges.
- Writer-flagged nits: unexercised `heartbeat` SSE schema member; a few stale source comments
  (`env.schema.ts` vision note, `result-aggregation.service.ts` "caps at 5",
  `matching-evidence.types.ts` "alongside the photo"); docs/eslint/README.md path drift —
  candidates for a fast-lane cleanup.
- 34 orphan-candidate docs reported by `knowledge:orphans` (merge/retire review).
