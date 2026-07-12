---
id: rule-35-generated-artifacts-and-freshness
title: 35 — Generated Artifacts & Freshness (hash-triggered, never hand-edited)
type: rule
authority: canonical
status: current
owner: repository owner
summary: Generated files declare their inputs, are rebuilt deterministically, are never edited by hand, and go stale by hash triggers — never by calendar age.
keywords: [generated, freshness, hashes, stale, deterministic, drift]
contextTier: 2
relatedCode: [scripts/knowledge/validate-generated-files.mjs, scripts/knowledge/find-stale-items.mjs]
relatedDocs: [knowledge/freshness-policy.yaml, rules/31-knowledge-management.md]
readWhen: touching anything under .ai/, the compiler, or freshness policy
---

# 35 — Generated Artifacts & Freshness

1. **Never hand-edit a generated file.** Everything under `.ai/` (and any file carrying the
   `GENERATED FILE` header) is compiler output. Wrong content means a wrong authored source or
   a compiler bug — fix that and `npm run knowledge:build`.
2. **Every generated file declares its inputs.** The compiler records inputs and their
   combined hash in `.ai/hashes/generated-from.json`; a generated file without a record is a
   validation error. This registry is how drift and manual edits are caught mechanically.
3. **Determinism is a requirement, not a preference.** Same inputs ⇒ byte-identical outputs:
   stable sort orders, sorted JSON keys, LF endings, POSIX paths, no timestamps, no
   randomness. A generated diff in review must be explainable by an authored-input diff.
4. **Freshness is hash-triggered.** A document becomes review-required when a source matching
   its [freshness trigger](../knowledge/freshness-policy.yaml) changes hash against the last
   build snapshot — calendar age alone never marks anything stale, and recency alone never
   marks anything fresh.
5. **Stale is visible, not silent.** `npm run knowledge:stale` /
   `.ai/generated/stale-items.json` list every review-required document and drifted artifact;
   pre-push and CI fail on generated-plane drift. Clearing the list is part of the change that
   caused it.
6. **Committed, not rebuilt-on-read.** The compiled plane is committed so a fresh clone (or a
   cold agent) gets an instant bootstrap; `.ai/local/` is the only uncommitted, per-task area.
7. **Incremental by hashes.** `knowledge:build:incremental` rebuilds only what changed inputs
   require; a change under `knowledge/` forces a full rebuild because everything compiles from
   those definitions.
