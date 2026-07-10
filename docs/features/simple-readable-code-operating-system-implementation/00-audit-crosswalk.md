# Audit and Requested-File Crosswalk

## Inspected surfaces

Root governance/agent files; `.cursor/rules`; all numbered/backend/frontend/security/AI/upload/test
rules; skill indexes and cleanup/build/review skills; context/memory indexes and maps; SDLC
baselines/templates/feature records; root/workspace manifests and TypeScript configs; ESLint/custom
plugins/tests; API bootstrap/config/core/modules/benchmarks/prompts/tests; web app/modules/packages/
shared/E2E; shared constants/schemas/types/utils/tests; CI, Docker, runbooks, release/support docs.

## Findings before this continuation

The Simple Code OS core had already landed in rules 28–30 and five consolidated cleanup skills, but
the request record was intake-only. Runtime was multimodal while most active guidance and this
request required text-only post-extraction behavior. Lint allowed warnings; frontend coverage was
waived; Knip exposed dead exports; Docker clean install failed; current/historical toolchain,
privacy, result-bound, and testing claims had drifted.

## Requested names → canonical owners

| Requested family | Canonical TwinzyAI owner used |
| --- | --- |
| Simple/YAGNI/reuse/no-clever/helper/token/review/refactor/agent rules | `rules/28-simple-readable-code.md`, `29-reuse-before-creating.md`, `30-refactor-discipline.md` |
| Declaration/size/frontend/backend rules | Existing rules 02–05, 16–19 plus `context/declaration-ownership-map.md` and ESLint plugins |
| AI/privacy/upload clean-code rules | Existing rules 14–15, extended rules 28/30, security/upload Cursor rules |
| Write/reuse/extract/split/remove/review cleanup skills | `write-simple-readable-code.md`, `simplify-existing-code.md`, `decompose-large-file.md`, `full-codebase-cleanup.md` plus existing create/review skills |
| AI/upload/frontend safe cleanup skills | `cleanup-without-weakening-safety.md`, `secure-file-upload.md`, accessibility/i18n/final-validation skills |
| Practical style/maintainability/token/ownership docs | `docs/simple-readable-code.md`, `docs/agent-readiness.md`, canonical review checklist, declaration map, cleanup skills |
| Refactor/agent/AI/privacy memory | `memory/code-simplicity-decisions.md`, `architecture-decisions.md`, `ai-safety-decisions.md`, `privacy-decisions.md`, `known-pitfalls.md` |
| Simple/refactor/agent/frontend/backend/AI/privacy context maps | Existing architecture, declaration ownership, codebase navigation, AI context, glossary, reference patterns, stack/toolchain |
| Agent entry files | `CLAUDE.md`, `AGENTS.md`, `CODEX.md`, `cursor.md`, `.cursorrules`, Cursor rules, and KIMI/GEMINI/GLM/QWEN/DEEPSEEK/OPENAI/ANTHROPIC/MISTRAL |

Creating every requested synonym as a standalone file would violate the same reuse/no-token-burning
policy being implemented. Existing owners were expanded and this crosswalk preserves discoverability.
On Windows, case-only `CLAUDE.md`/`claude.md` and `CODEX.md`/`codex.md` are the same files.
