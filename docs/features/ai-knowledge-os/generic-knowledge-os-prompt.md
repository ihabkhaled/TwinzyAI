# The Generic Knowledge-OS Prompt (portable — works on any repository)

> Copy everything below the line into a capable AI coding agent inside any repository.
> It is the generalized, battle-tested version of the prompt that built TwinzyAI's knowledge
> OS, with the implementation lessons folded back in. Nothing in it assumes a language,
> framework, or domain.

---

You are the Principal Knowledge Architect, Software Architect, Staff Engineer, Repository
Archaeologist, QA Architect, Security & Privacy Reviewer, Performance Engineer, Reliability
Engineer, DevOps Engineer, Support Engineer, and Technical Program Manager for THIS repository.

Your mission is to transform this repository into an AI-native, incrementally compiled,
extremely fast **Engineering Knowledge Operating System** that lets any capable AI coding
agent understand, plan, implement, test, review, document, release, operate, troubleshoot,
and roll back changes with minimal context-loading latency.

The system must be: extremely fast; deeply structured; exhaustive in coverage; minimal in
initial context; incrementally compiled; deterministic; searchable; machine-readable;
human-readable; evidence-based; contradiction-resistant; automatically validated; optimized
for AI agents; safe for a public repository; maintainable without manual synchronization.

**Primary performance goal:** a routine task that previously required minutes of repository
reading should begin producing a grounded implementation plan within a few seconds and begin
targeted implementation almost immediately afterward. This is a performance target, not
permission to guess. Speed comes from precomputation, routing, indexing, context compression,
incremental updates, and parallel retrieval — never from skipping correctness, privacy,
security, testing, or architecture constraints.

======================================================================
0. FIRST: DISCOVER THE REPOSITORY, NEVER ASSUME IT
======================================================================

Before building anything, run a parallel evidence-mapping pass (fan out subagents if your
tooling allows) and write the findings to working files:

- source layout: workspaces/packages/apps, module anatomy, layer conventions, entrypoints;
- existing knowledge assets: any rules/, docs/, wiki, ADRs, runbooks, agent bootstrap files
  (CLAUDE.md / AGENTS.md / .cursor rules / model-specific bootstraps);
- the toolchain: build, lint, format, typecheck, test, coverage, release commands — and the
  exact lint/format constraints ANY new script you write must satisfy (max lines, complexity,
  import order, banned patterns); read the lint config before writing compiler code;
- hooks and CI: what runs at pre-commit / pre-push / CI, how heavy each is;
- the domain's non-negotiable invariants (privacy, security, money, compliance, safety) —
  verified against code with file citations, not restated from possibly stale docs;
- contradictions: everywhere the recorded policy, the docs, the mirrors, the example config,
  and the code disagree. List each with both sources, evidence, and which should win.

Every factual claim in the knowledge system you build must trace to a file you read or a
recorded decision. If a section would be speculation, write `Not applicable — <why>` or
`Deferred — needs <evidence>`. Placeholder stubs are forbidden.

======================================================================
1. NON-NEGOTIABLE PERFORMANCE TARGETS
======================================================================

- **Bootstrap:** one file, ≤ ~1,500 tokens, readable in one tool call, carrying every
  universal invariant, the fast-task protocol, the authority order, and open critical
  contradictions. Enforce the budget mechanically (the build fails when exceeded).
- **Resolver:** p50 < 300ms, p95 < 1s, no network, no full rescan at task time (expect to
  beat this by orders of magnitude — path/symbol/keyword routing over precompiled indexes
  runs in single-digit milliseconds even on large repos).
- **Routine task:** initial context 3,000–8,000 tokens, usually < 10–15 documents, exact
  source files and tests identified before any broad documentation.
- **Planning:** classify → resolve context → inspect exact code/tests → grounded plan in the
  first response cycle. **Implementation:** begins right after targeted verification; never
  blocked on repository-wide audits.
- **Expansion:** additional context loads only when evidence demands it — unclear dependency,
  contradiction, boundary crossing, lane escalation, or insufficient initial pack.

======================================================================
2. CORE ARCHITECTURE: THREE KNOWLEDGE PLANES
======================================================================

**2.1 Canonical plane (authored, human-maintained source of truth).** The repository's
existing knowledge folders plus, as needed: rules/skills(playbooks)/context(summaries)/
memory(decisions+pitfalls)/agents(review roles)/testing/support/runbooks/architecture(ADRs)/
structure/product/domain/contracts/operations/incidents/quality/docs. Map to whatever names
the repo already uses — the responsibilities matter, not the names. Canonical docs are
detailed and are NOT loaded wholesale per task.

**2.2 Compiled plane (`.ai/`, generated, committed, never hand-edited).**

```
.ai/
  README.md  BOOTSTRAP.md  HOT_MEMORY.md  QUICK_ROUTER.md  CURRENT_STATE.md
  manifests/   repository, documents, modules, symbols, tests, routes, contracts,
               errors, configs, prompts(if AI), dependencies, commands, ownership, risks
  indexes/     keywords, symbols, paths, task-types, file-patterns, modules, rules,
               skills, agents, tests, errors, routes, configs
  packs/       one compiled context pack per task type
  summaries/   compact area digests (compiled from authored sources)
  graphs/      dependency, source-test, source-doc, contract, impact, relationships
  hashes/      source/document/pack hash snapshots + generated-from.json
  generated/   stale-items, broken-links, contradictions, orphans, duplicate-topics,
               unresolved-references, context-performance
  local/       per-task resolver output (gitignored)
```

Rules: every generated file declares its canonical inputs in `hashes/generated-from.json`
(inputs + combined hash); one build command recreates everything deterministically; generated
Markdown carries a `GENERATED FILE` header; `.ai/local/` is the only uncommitted area. Exempt
`.ai/` from the repo formatter (the compiler's byte-stable output is authoritative).

**KEY PATTERN (learned):** anything in `.ai/` that needs curated prose — the bootstrap, hot
memory, summaries, pack invariants — gets an **authored source file in the canonical plane**
(e.g. `knowledge/bootstrap.md`, `knowledge/summaries/*.md`, `knowledge/packs.yaml`) that the
compiler copies/renders in with budget checks and input recording. This keeps "never hand-edit
.ai/" absolute without making prose ungovernable.

**2.3 Execution plane (the runtime protocol).** Agents must not wander. For every task:
1) load `.ai/BOOTSTRAP.md`; 2) classify; 3) run the resolver; 4) read the returned pack +
exact source + exact tests (in parallel); 5) resolve listed ambiguities; 6) plan; 7) implement;
8) validate with the pack's commands; 9) update affected canonical docs; 10) rebuild affected
`.ai/` artifacts in the same commit.

======================================================================
3. TWO OPERATING MODES
======================================================================

**BUILD MODE** (initial creation, big canonical changes, structural moves, stale cache, CI
detection, explicit audit requests): may do repository inventory, source scanning, symbol
extraction, dependency/route/schema/test discovery, doc parsing, link validation,
contradiction detection, pack compilation, hashing, graphs, full validation. Slower is fine —
its output accelerates every later task.

**FAST TASK MODE** (default): never starts with a full audit; never reads every doc folder;
never regenerates the system before planning; never loads every rule. It consumes the
compiled plane; only a missing or provably stale cache triggers a (partial) rebuild.

======================================================================
4. AUTHORED KNOWLEDGE DEFINITIONS (the `knowledge/` folder)
======================================================================

Create a `knowledge/` folder owning the machine-readable definitions the compiler consumes:

- `README.md` — the owner's manual (planes, files, commands, editing rules).
- `manifest.yaml` — system version, plane inventory, build entrypoints.
- `authority-map.yaml` — precedence order when sources disagree (governance file →
  engineering canon → rules → decisions/ADRs/memory → area canon → summaries → generated
  facts → temporary feature work), plus tie-breakers: stricter rule wins; code+tests are
  evidence of behavior, not approved policy; a summary disagreeing with its source is stale.
- `routing-map.yaml` — THE core: one entry per task type with `title, lane, pack, keywords,
  pathHints, mustRead, rules, skills, reviewers, validation`. Derive task types from what the
  repo actually does; a typical set: routine-fix, backend-feature, frontend-feature,
  full-stack-feature, refactor, production-bug, architecture-change, api-contract-change,
  configuration-change, performance-change, reliability-change, accessibility-change,
  localization-change, dependency-change, testing-change, support-change, release, rollback,
  incident, knowledge-change — plus domain-critical types (payments, uploads, AI pipeline,
  prompts, privacy…) matching the repo's risk surfaces. Every referenced path is validated.
- `vocabulary.yaml` — canonical terms + synonyms the classifier expands. **Lesson:** quote
  numeric-looking synonyms (YAML parses `402` as a number) and make the classifier
  string-coerce defensively.
- `risk-classification.yaml` — deterministic lane mapping: path patterns + keywords →
  fast/standard/critical; highest match wins; ambiguity escalates one lane.
- `delivery-lanes.yaml` — lanes scale artifact WEIGHT, never phase EXISTENCE: fast = one
  compact task record; standard = compact artifact set; critical = full governance depth
  (threat model, specialist reviewers, rollback design). Wire lanes into whatever governance
  process the repo already has instead of replacing it.
- `context-budget-policy.yaml` — hard budgets (bootstrap/hot-memory ~1,500; summaries ~2,500;
  packs ~6,000, critical ~15,000 tokens; ~4 chars/token heuristic) + resolver targets.
- `freshness-policy.yaml` — hash triggers: `whenChanged: <path fragment>` → `review: [docs]`.
  Never calendar-based.
- `contradiction-checks.yaml` — two sections: `checks` (machine-verifiable: assert-absent /
  assert-present / assert-file-exists / config-mirror patterns for the repo's invariants) and
  `registry` (recorded open contradictions with sources, severity, owner, resolution; critical
  open entries compile into the bootstrap until resolved). **Lesson:** write assert-absent
  patterns to match the real construct (e.g. directive comments), not prose mentions of it.
- `packs.yaml` — per task type: 3–5 area-specific invariants + short notes. The builder joins
  this with the routing map and generated manifests (code entrypoints from pathHints, tests
  from module ownership) into `.ai/packs/*.md`. Universal invariants stay in the bootstrap.
- `bootstrap.md` + `hot-memory.md` — authored sources (frontmattered) with a
  `{{CRITICAL_CONTRADICTIONS}}` placeholder in the bootstrap. Bootstrap contents: project
  purpose; the verified non-negotiable invariants (with owning file paths); architecture
  anatomy + enforcement; the fast-task protocol; the authority order; current critical items;
  pointers to detail. Hot memory: only currently active high-impact facts (in-flight
  programs, recent landings agents misjudge, live traps, open process debt), pruned on
  resolution — history lives elsewhere.
- `summaries/*.md` — 10–15 dense area digests (product, domain, architecture, backend,
  frontend, per-specialty, configuration, testing, operations, support, current-risks).
- `golden/tasks.yaml` — 15–25 benchmark tasks: `{id, task, files?, expect: {taskType, lane,
  mustInclude: [paths]}}` spanning every important task type. **Lessons:** phrase tasks the
  way users actually write them; expected lanes must account for risk-keyword escalation
  (e.g. anything mentioning a critical keyword escalates); cite only real file paths.
- `golden/questions.yaml` — 10+ knowledge-regression questions: `{question, expectedAnswer,
  canonicalSource, codeEvidence, maxContextTokens}`; source existence machine-checked.
- `schemas/`, `templates/` — JSON schemas for compiler IO; a frontmatter template
  (`id, title, type, authority, status, owner, summary, keywords, contextTier 0–4,
  relatedCode, relatedTests, relatedDocs, readWhen`). Templates are exempt from link/
  frontmatter validation (their links target deployed locations).

======================================================================
5. THE KNOWLEDGE COMPILER (`scripts/knowledge/`)
======================================================================

Plain scripts in the repository's native scripting language, obeying ALL repo lint rules
(read them first; expect max-lines/complexity caps to force many small modules — that is
good). No new infrastructure: no graph DB, no vector DB, no remote search. A tiny YAML parser
dependency is acceptable (wrap it; record the decision); semantic embeddings only ever as a
later optional local adapter behind measured need. The mandatory fast path works on paths,
symbols, keywords, imports, metadata, ownership, patterns, relationships, hashes.

Shared lib: deterministic fs walk (sorted, excluded build dirs), stable JSON (recursively
sorted keys, trailing newline), sha256 hashing (LF-normalized), token estimator (~4 chars),
markdown structure extraction (frontmatter split, headings, relative links, source-path
mentions), YAML/frontmatter IO, generated-artifact writer (header + generated-from
recording), import resolver (relative specifier → file against the scanned set), CLI harness
(importable module + standalone command; exit code, never process.exit).

Scanners (each a small module + CLI): documents (identity/routing/structure/size per doc,
directory-based defaults for legacy docs without frontmatter), source (module/layer/exports/
imports per file — classify by path anatomy, not per-module hardcoding), symbols, tests
(kind + covered sources via resolved imports), routes/endpoints (**lesson:** repos with
no-magic-string rules pass route paths as named constants — resolve identifier decorator
arguments through a repo-wide constant map), schemas/contracts (+ consumers), errors, config
(example-env entries ∪ actual env reads; flag drift both ways), dependencies (workspace
manifests + cross-module import edges), commands (package scripts), ownership (scan merged
with an authored ownership map; unmapped modules stay visible).

Builders: indexes (keywords→docs with a non-discriminative cutoff, symbols→files, task types
with vocabulary expanded at build time, file patterns, modules, compact rule/skill/agent/
route/error/config views), graphs (dependency, source-test, source-doc with
explicit/generated/inferred labels, contract usage, per-module impact, unified relationships),
packs, bootstrap (placeholder injection + budget), hot memory (budget), summaries (budget),
quick router (task→lane/pack/first-read table), current state (counts + active work + open
findings), hash snapshots (LAST, so they describe the state the build saw).

Analyzers: stale items (generated-from drift + freshness triggers vs snapshots),
contradictions (checks + registry; findings fail the build), duplicates (ids/titles among
frontmattered docs), orphans (unreferenced by links/routing; historical dirs exempt).

Validators (all hard-fail): frontmatter (required in new areas, progressive elsewhere,
unique ids), links (broken links fail in frontmattered docs + knowledge/; report-only in
legacy docs), source references (every path in routing/packs/frontmatter exists; every task
type has a pack and vice versa), generated files (inputs unchanged since build, headers
present), packs (present, budgeted).

Runtime: classify-task (keyword scoring with word-boundary + plural tolerance + task-type
name-mention bonus; deterministic tie-breaks; confidence + runners-up), resolve-context
(classify → lane → modules via paths/names/symbols → select pack/docs/source/tests/reviewers/
validation → token estimate → EXPLICIT ambiguities list → write local context files + timing),
benchmark (golden tasks through the in-process resolver, warm-up run, p50/p95, hard-fail on
wrong type/lane/missing context/missed p95; verify golden-question sources), report
(read-only summary).

Orchestrators: `build` (scans → indexes/graphs → compiled artifacts → analyses → snapshots;
fails on contradiction findings), `build-incremental` (hash-diff vs snapshots; a change under
`knowledge/` forces full rebuild; otherwise rebuild only the affected side INCLUDING its
manifests).

Commands to wire (package scripts): `knowledge:build`, `:build:incremental`, `:context`,
`:classify`, `:validate`, `:links`, `:stale`, `:contradictions`, `:duplicates`, `:orphans`,
`:graphs`, `:packs`, `:benchmark`, `:report`, `:refresh`, `:tokens`. Register the scripts
directory with the repo's dead-code tool.

**Codemod warning (learned the hard way):** when bulk-adapting code to lint rules (e.g.
`sort`→`toSorted`), in-place mutation calls whose results were intentionally discarded become
silent no-ops — re-check every converted call site and re-run the full build + benchmark.

======================================================================
6. VALIDATION, HOOKS, CI
======================================================================

- Do not slow local development: keep pre-commit unchanged unless it is already heavy; add
  `knowledge:validate` (~1s) to pre-push — it catches "changed sources without rebuilding
  `.ai/`" before it ships, without mutating the tree.
- CI knowledge gate: `knowledge:build` → `git diff --exit-code .ai` (drift = failure) →
  `knowledge:validate` → `knowledge:benchmark` → `knowledge:report`. Match the repo's
  existing CI workflow style.
- The golden benchmark is a gate equal to tests: wrong routing blocks knowledge changes.

======================================================================
7. CONTRADICTION MANAGEMENT AND POLICY RECONCILIATION
======================================================================

The mapping pass WILL find places where recorded policy, mirrors, example configs, and code
disagree (stale "never do X" absolutes after a recorded decision permitted X; example-config
values contradicting each other; agent-bootstrap mirrors asserting outdated facts). Handle
them exactly like this:

1. Record every contradiction in the registry with sources, severity, owner, and the
   evidence-based resolution ("which should win" — usually the recorded owner decision).
2. Update the canonical policy text FIRST to state the recorded decision faithfully —
   including what remains forbidden/open — then update every mirror in the same stream.
3. Reconcile mechanical inconsistencies (config mirrors, stale comments) and add a machine
   check so they cannot silently recur.
4. Keep genuinely open items (owner approvals, unmet conditions) as open registry entries —
   compiled into the bootstrap until resolved. Never silently merge; never quietly drop.

======================================================================
8. CANONICAL BACKFILL (parallel writer fleet)
======================================================================

Fan out parallel writer agents with DISJOINT directory ownership, each grounded in the
mapping-pass evidence files plus repo reads. Every writer gets: the frontmatter template, the
current-truth summary of reconciled policy (so no writer restates stale absolutes), the
evidence rules (cite paths; `Not applicable`/`Deferred` over invention; ≤~250 lines/file;
link the owning doc instead of restating), and a required structured return (files written +
open questions). Collect the open questions — they are real findings (path typos, stale
comments, undecided product questions); fix or record each one.

Areas (adapt to the repo): structure/ (repository map, module catalog, ownership map THE
COMPILER CONSUMES, layer map, topology, flows, per-module docs), product/, domain/,
contracts/ (API/integration/config contracts with real endpoint inventories), operations/ +
incidents/ + quality/, a deep area for the repo's specialty (e.g. docs/ai/ for an AI
pipeline), support/ + runbooks/, and the `knowledge/summaries/` sources.

======================================================================
9. RULES, SKILLS, AND AGENT BOOTSTRAPS
======================================================================

- Add permanent rules (numbered into the repo's rule system, or a new one): knowledge
  management (planes, one-fact-one-owner, rebuild-in-same-commit), documentation quality
  (frontmatter, evidence, links, tiers, no duplicates), fast context routing (resolver-first,
  hard budgets, golden benchmark as gate), memory lifecycle (dated/evidenced entries, hot
  working set, promotion/supersession), generated artifacts & freshness (never hand-edit,
  declared inputs, determinism, hash triggers), delivery lanes & traceability. Prefer a few
  substantive rules over many stubs.
- Add the `resolve-task-context` skill/playbook — the mandatory first step of any task.
- Update EVERY agent bootstrap file (AGENTS.md, model-specific mirrors, IDE rule files) to:
  read `.ai/BOOTSTRAP.md` first → run the resolver → read the pack + exact code/tests → plan
  → implement → load canonical detail only when routed → never bypass invariants or gates.
  Keep mirrors compact (never copy full rule bodies); update them all in the same stream.

======================================================================
10. QUALITY BARS AND ANTI-PATTERNS
======================================================================

Anti-patterns (forbidden): reading all documentation before every task; loading the entire
governance file when a compiled bootstrap exists; concatenating all rules into one pack;
duplicating facts across agent files; full index rebuilds per request; runtime network search
for repo knowledge; a document per trivial function; giant unstructured files; manually
maintained generated lists; hidden contradictions; treating summaries as canonical; stale
docs in normal routing; forcing routine fixes through critical-lane ceremony; skipping
source/test inspection for speed; guessing ownership at low confidence; weakening security/
privacy/safety/validation/tests/architecture; delaying simple implementations for unrelated
repo-wide artifacts; adding retrieval infrastructure without measured need.

Planning standard (deep AND immediate): Task → Current owner (module/layer/symbols/tests) →
Current behavior (verified) → Target behavior → Impact (source/contracts/config/tests/docs/
ops) → Implementation sequence (smallest safe change first) → Risks → Validation (exact
commands/files) → Rollback. Routine plans stay compact; critical plans go deeper but stay
routed.

======================================================================
11. EXECUTION ORDER
======================================================================

1. **Map** — parallel evidence pass (§0); save per-area reports; extract invariants +
   contradictions.
2. **Compiler core** — lib + scanners; smoke-test against the real repo immediately.
3. **Authored definitions** — knowledge/ (authority, lanes, risk, budgets, routing map,
   vocabulary, freshness, contradiction checks incl. registry seeded from §1 findings).
4. **Launch the writer fleet** (long pole — run it in parallel with steps 5–7).
5. **Builders + validators + resolver + benchmark + orchestrators**; wire commands, dead-code
   tool, ignores; add lint-config exceptions ONLY as documented false-positive relaxations in
   the repo's established exception mechanism.
6. **Bootstrap + hot memory + packs + golden sets** from verified facts.
7. **Policy reconciliation** (§7) — canon, rules, mirrors, example configs.
8. **Integrate writer output** — fix flagged paths, rebuild, get `knowledge:validate` +
   `knowledge:benchmark` fully green.
9. **Hooks + CI**; run every repository gate (format, lint at zero warnings, typecheck,
   dead-code, cycles, tests, build) and fix everything.
10. **Record** — governance artifacts for this program itself (intake → requirements →
    architecture → impact → test strategy → readiness → validation report → docs changelog),
    release notes, and a memory/hot-memory entry. Measure and report the before/after:
    resolver latency, context size, benchmark results, validation status.

Work in reviewable slices; commit logically (compiler / definitions / canonical docs / policy
sync / generated plane / CI+hooks / governance); never bypass hooks; report outcomes
faithfully — including what remains open.
