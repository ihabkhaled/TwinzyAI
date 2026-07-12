# 08 — Architecture Review: AI Knowledge Operating System

(Phase 06 technical refinement merged here per the standard-lane compression rule.)

## Chosen architecture

Three planes with one-way compilation:

- **Canonical plane** (authored): existing dirs + new `knowledge/` (routing-map, delivery
  lanes, risk classification, budgets, packs, bootstrap/hot-memory sources, golden sets,
  contradiction checks) + new area dirs (structure/product/domain/contracts/operations/
  incidents/quality/docs-ai).
- **Compiled plane** (`.ai/`, committed, never hand-edited): bootstrap, hot memory, quick
  router, current state, 15 manifests, 16 indexes, 26 packs, 13 summaries, 6 graphs, hash
  snapshots + generated-from registry, findings reports.
- **Execution plane**: resolver (`scripts/knowledge/resolve-context.mjs`) reading only
  compiled indexes; fast-task protocol in `skills/resolve-task-context.md`.

Compiler: 35 plain-ESM scripts under `scripts/knowledge/` (lib/ + scanners + builders +
validators + analyzers + orchestrators), each ≤300 lines, repo lint rules fully applied.

## Alternatives considered and rejected

- **Vector/embedding retrieval or external search service** — rejected per the measured-need
  rule; path/symbol/keyword routing meets the p95 target by ~250×. Revisit only with evidence.
- **Hand-rolled YAML subset parser** — rejected (silent-breakage risk on human-edited files);
  `yaml` (zero-dep) added as a dev dependency, wrapped in `lib/yaml-io.mjs`
  (docs/package-decisions.md).
- **Rebuild-on-read instead of committed `.ai/`** — rejected: cold agents need instant
  bootstrap; drift is caught by hash validation instead.
- **Manually maintained summaries inside `.ai/`** — rejected; authored sources live in
  `knowledge/` and compile in, preserving "generated plane is never hand-edited".

## Boundary and enforcement notes

- No runtime coupling: nothing under `apps/` or `packages/shared` imports the compiler.
- ESLint relaxations are per-file/per-dir and documented (`docs/eslint-architecture.md`):
  security-plugin false-positive families for the compiler dir; `detect-child-process` for the
  single fixed `git diff` call. The regexp plugin (error level) still guards regex safety.
- Determinism contract: sorted keys/arrays, LF, POSIX paths, no timestamps/randomness
  (rule 35); `hashes/generated-from.json` records every artifact's inputs.

## ADR decision

The knowledge OS itself is recorded as permanent policy in CLAUDE.md (new section) and rules
31–36 rather than a separate ADR, since it changes standing policy, not a single technical
choice. Follow-up ADRs apply to future compiler-architecture changes.
