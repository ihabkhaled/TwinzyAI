# 03 — Product Requirements: AI Knowledge Operating System

(Phases 01/02 business framing merged here per the standard-lane compression rule: the business
problem is agent latency and drift — a routine task previously needed one to two minutes of
repository reading before a grounded plan; stale policy texts caused contradictory agent
behavior. Success = grounded planning within seconds, zero unrecorded contradictions.)

## Requirements and acceptance criteria (all verified — see 15)

1. **Compact bootstrap** `.ai/BOOTSTRAP.md` ≤ ~1,500 tokens carrying every universal invariant,
   the fast-task protocol, authority order, and open critical contradictions.
   *AC: compiled at 1,32x tokens; budget mechanically enforced (build fails over budget).*
2. **Context resolver** `npm run knowledge:context -- --task="..." [--files] [--diff]`
   producing `.ai/local/current-context.{json,md}` with task type, lane, pack, docs, source,
   tests, reviewers, validation, ambiguities. *AC: p50 < 300ms / p95 < 1s targets — measured
   p50 ~3ms, p95 ~4ms; routine context < 8,000 tokens and < 15 docs — max 6 docs.*
3. **Deterministic compiler** rebuilding all of `.ai/` (manifests, indexes, packs, graphs,
   summaries, hashes, findings) from canonical sources. *AC: full build < 1s; byte-stable;
   drift detected by `knowledge:validate` + CI `git diff --exit-code .ai`.*
4. **Risk-based delivery lanes** (fast/standard/critical) deterministic from paths+keywords.
   *AC: `knowledge/delivery-lanes.yaml` + `risk-classification.yaml`; rule 36.*
5. **Contradiction management**: machine checks + registry; critical open entries injected
   into the bootstrap. *AC: 6 checks run every build; 3 registry entries recorded; 2 real
   findings (eslint-suppression false positive → pattern refined; `.env.example` price mirror
   → reconciled) surfaced and fixed.*
6. **Golden benchmarks**: 21 golden tasks + 11 golden questions as a knowledge regression
   suite. *AC: `knowledge:benchmark` green, wrong type/lane or missing context fails.*
7. **Canonical backfill**: structure/, product/, domain/, contracts/, operations/, incidents/,
   quality/, docs/ai/, knowledge/summaries/, support/, runbooks/ — evidence-cited, frontmattered.
   *AC: 150+ documents; `knowledge:validate` frontmatter/links/source-references green.*
8. **Policy reconciliation**: CLAUDE.md constraint #1, rules/00 rule 42, AGENTS.md, 12 mirror
   files, `.env.example` aligned with the recorded 2026-07-12 paywall supersession; free
   default preserved and stated. *AC: contradiction registry documents the supersession and
   the still-open LIVE conditions.*

## Non-goals

Runtime behavior, vector/semantic retrieval (documented as a possible later optional adapter),
rewriting legacy docs wholesale (progressive frontmatter adoption instead).
