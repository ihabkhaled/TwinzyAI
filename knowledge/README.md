---
id: knowledge-readme
title: knowledge/ — Authored Knowledge-OS Definitions
type: knowledge-definition
authority: canonical
summary: Owner's manual for the knowledge plane — what is authored here, what is compiled into .ai/, and the commands that connect them.
keywords: [knowledge, routing, compiler, bootstrap, packs, context, resolver]
contextTier: 2
relatedDocs: [.ai/README.md, rules/31-knowledge-management.md]
---

# knowledge/ — Authored Knowledge-OS Definitions

This folder is the **authored source** of the AI Knowledge Operating System. Everything here is
human/AI-curated, reviewed, and canonical. The knowledge compiler
([`scripts/knowledge/`](../scripts/knowledge/build.mjs)) compiles these definitions — together
with scans of the real source tree — into the **generated acceleration plane** under
[`.ai/`](../.ai/README.md), which agents load at runtime.

**One fact, one owner:** files under `.ai/` are never edited by hand; files here are never
generated. If a `.ai/` file is wrong, fix the authored source (or the compiler) and rebuild.

## The three planes

1. **Canonical plane** — `CLAUDE.md`, `rules/`, `skills/`, `context/`, `memory/`, `agents/`,
   `testing/`, `support/`, `runbooks/`, `structure/`, `product/`, `domain/`, `contracts/`,
   `operations/`, `incidents/`, `quality/`, `docs/`. Maintained detail, loaded on demand.
2. **Compiled plane** — `.ai/` (bootstrap, hot memory, manifests, indexes, packs, summaries,
   graphs, hashes, findings). Generated, deterministic, committed.
3. **Execution plane** — the fast-task protocol: load `.ai/BOOTSTRAP.md`, run
   `npm run knowledge:context -- --task="..."`, read the resolved pack + exact code + tests,
   plan, implement. Defined in [`skills/resolve-task-context.md`](../skills/resolve-task-context.md).

## What lives here

| File | Owns |
| --- | --- |
| `manifest.yaml` | Knowledge-system version, plane inventory, build entrypoints |
| `authority-map.yaml` | Precedence order when sources disagree |
| `routing-map.yaml` | Task types → keywords, lane, pack, docs, rules, skills, reviewers, validation |
| `vocabulary.yaml` | Canonical terms and synonyms used by the task classifier |
| `relationship-types.yaml` | Allowed edge types/labels in generated graphs |
| `freshness-policy.yaml` | Source-change triggers → documents that need review |
| `context-budget-policy.yaml` | Token budgets per tier/artifact; resolver performance targets |
| `risk-classification.yaml` | Path/keyword patterns → delivery lane |
| `delivery-lanes.yaml` | Fast / Standard / Critical lane definitions and required artifacts |
| `contradiction-checks.yaml` | Machine contradiction checks + the open-contradiction registry |
| `bootstrap.md` | Authored body compiled into `.ai/BOOTSTRAP.md` (≤ ~1,500 tokens) |
| `hot-memory.md` | Authored hot facts compiled into `.ai/HOT_MEMORY.md` (≤ ~1,500 tokens) |
| `summaries/*.md` | Compact area digests compiled into `.ai/summaries/` |
| `packs/*.yaml` | Context-pack definitions compiled into `.ai/packs/` |
| `golden/tasks.yaml` | Golden benchmark tasks for `knowledge:benchmark` |
| `golden/questions.yaml` | Golden knowledge questions (knowledge regression suite) |
| `schemas/` | JSON Schemas for compiler inputs/outputs |
| `templates/` | Frontmatter/document templates for new canonical docs |

## Commands

| Command | Effect |
| --- | --- |
| `npm run knowledge:build` | Full deterministic recompile of `.ai/` |
| `npm run knowledge:build:incremental` | Rebuild only what changed (hash-triggered) |
| `npm run knowledge:context -- --task="..."` | Resolve a task into `.ai/local/current-context.{json,md}` |
| `npm run knowledge:validate` | Frontmatter, links, source refs, packs, generated-file drift |
| `npm run knowledge:benchmark` | Resolver latency/precision against `golden/tasks.yaml` |
| `npm run knowledge:report` | Human summary of stale items, contradictions, orphans, dupes |

## Editing rules

- Changing any file here requires rebuilding `.ai/` in the same commit (`knowledge:build`);
  pre-push and CI verify drift.
- New task types get: a `routing-map.yaml` entry, a pack in `packs/`, keywords in
  `vocabulary.yaml`, and a golden task in `golden/tasks.yaml`.
- Facts stated in `bootstrap.md`, `hot-memory.md`, and `summaries/` must cite/point to their
  canonical owner — they are compiled views, not second sources of truth.
