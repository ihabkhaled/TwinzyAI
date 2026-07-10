# 00 - Intake: Simple Readable Code Operating System + Codebase Refactor

> Continued under the owner-requested canonical slug
> [`simple-readable-code-operating-system-implementation`](../simple-readable-code-operating-system-implementation/00-intake.md).
> This earlier intake remains as the record for the already-landed governance/cleanup slices.

- Request ID: `simple-readable-code-operating-system-and-codebase-refactor`
- Type: governance update + full-repo maintainability/readability refactor (owner directive, 2026-07-10)
- Classification: rules/skills/docs/memory/context/agent-readiness update · zero-inline enforcement · backend/frontend/shared cleanup · ESLint investigation · AI-safety/privacy PRESERVING refactor
- Owners: Engineering (AI-assisted)
- Scope statement: add the permanent Simple-Code OS (ladder, YAGNI/reuse, refactor discipline, agent mirrors), then refactor the actual codebase to full declaration-ownership + size + duplication compliance — without weakening any privacy/AI-safety/upload/a11y/i18n/test guarantee.

## Inspection summary (state before this change)

The repo already enforces most of the requested standard mechanically: custom ESLint plugins ban inline domain declarations (backend incl. module-level consts; frontend incl. hooks/services/gateways), controller logic, repository drift, TSX logic, direct SDK/env/browser access; sizes are capped (components 130/60, complexity 12, params 5); TS `enum`/`any`/non-null/eslint-disable are banned; lint is 0/0. Rules 00–27, ~60 skills, context maps, memory logs, and Claude/Codex/Cursor mirrors exist. Gaps: no written simple-code philosophy/ladder; no reuse-before-creating rule generalized beyond constants; no refactor-discipline rule; agent mirrors missing for Kimi/Gemini/GLM/Qwen/DeepSeek/OpenAI/Anthropic/Mistral; residual violations only detectable by sweep (duplication, long-file gray zones, magic strings the lint rules tolerate).

## Decisions of record

- Followed the repo's ACTUAL structure (frontend `modules/`, not `features/`; interfaces stay in `.types.ts` — a separate `.interfaces.ts` owner would create the parallel-owner problem the policy bans). Requested-file → actual-owner mapping: suggested rules 26–37 consolidated into rules **28–30** + extensions of existing owners (05 already owns declaration ownership, 19 sizes, 23 review, 24 gates); suggested 20 skills consolidated into **5** (+ existing create-*/review skills already covering the rest); suggested 12 docs consolidated into **docs/simple-readable-code.md** + **docs/agent-readiness.md** + the context ownership map; suggested 10 context files consolidated into **context/declaration-ownership-map.md** + index updates — per the prompt's own "extend the existing owner / no duplicate docs" instruction.
- Audit executed as a 6-scanner parallel workflow (backend decls, backend size+dup, frontend decls, frontend size+dup, shared/scripts/config, dead-code+forbidden patterns); findings triaged and fixed by ownership (see 08-refactor-log.md).

## Strategies

- **Refactor**: ownership-driven loop per rules/30; safety surfaces via skills/cleanup-without-weakening-safety.md; one concern per commit.
- **Tests**: behavior changes get tests first; moved declarations keep existing suites green untouched; focused suites after each slice; full gates before each commit.
- **Docs**: updated in the same stream (this folder + rules/skills/context/memory indexes + mirrors).
- **Rollback**: git-revert per slice; no data, no config semantics changed.
- **Risks**: parallel-session file churn (mitigated: commit-per-slice); large-jump lint noise already absorbed by the dependency-upgrade program.
