<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/templates/ai-readme.md -->

# .ai/ — Generated AI Acceleration Plane

Everything in this folder is **generated** by `npm run knowledge:build` from the canonical
plane (authored sources in `knowledge/` plus mechanical scans of the source tree). Never edit
these files by hand — fix the authored source or the compiler and rebuild. Drift is detected
by `npm run knowledge:validate` (and CI).

Start here as an agent:

1. `BOOTSTRAP.md` — universal invariants + the fast-task protocol (~1,500 tokens).
2. `npm run knowledge:context -- --task="<your task>"` → `local/current-context.md`.
3. `HOT_MEMORY.md` — active high-impact facts; `QUICK_ROUTER.md` — task→pack table;
   `CURRENT_STATE.md` — repo shape at last build.

Layout: `manifests/` (documents, repository, symbols, tests, routes, contracts, errors,
configs, prompts, dependencies, commands, ownership, modules, packages, risks) · `indexes/`
(keywords, symbols, paths, task-types, file-patterns, rules, skills, agents…) · `packs/`
(per-task-type context packs) · `summaries/` (compact area digests) · `graphs/` (dependency,
source-test, source-doc, contract, impact, relationships) · `hashes/` (freshness snapshots +
generated-from registry) · `generated/` (stale items, contradictions, broken links, orphans,
duplicates, benchmark results) · `local/` (gitignored per-task resolver output).

Authored counterpart and editing rules: [`knowledge/README.md`](../knowledge/README.md).
