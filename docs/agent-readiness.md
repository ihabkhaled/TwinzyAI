# Agent Readiness

TwinzyAI is operated by many AI coding agents (Claude, Codex, Cursor, Kimi, Gemini, GLM, Qwen, DeepSeek, OpenAI, Anthropic, Mistral, …). This doc defines how the repo stays safe and consistent under all of them.

## Entrypoints

Every agent boots from a compact mirror file that points at the same canon:

| Agent | Entrypoint |
| --- | --- |
| Claude (Code/API) | `/CLAUDE.md` (canonical governance) |
| Codex | `/AGENTS.md`, `/CODEX.md` |
| Cursor | `/cursor.md`, `/.cursorrules`, `/.cursor/rules/*.mdc` |
| Kimi / Gemini / GLM / Qwen / DeepSeek / OpenAI / Anthropic / Mistral | `/KIMI.md`, `/GEMINI.md`, `/GLM.md`, `/QWEN.md`, `/DEEPSEEK.md`, `/OPENAI.md`, `/ANTHROPIC.md`, `/MISTRAL.md` |

Mirror contract ([rules/30 §3](../rules/30-refactor-discipline.md)): compact bootstrap only — the Simple Code Ladder, the never-weaken list, the precedence statement, and links to `rules/README.md`, `rules/00`, `rules/28–30`, `skills/README.md`, `context/architecture-map.md`, `context/declaration-ownership-map.md`, `memory/known-pitfalls.md`. Mirrors never carry rule bodies and never drift; canonical file updates first, mirrors in the same delivery stream ([skills/prepare-agent-mirrors.md](../skills/prepare-agent-mirrors.md)).

## Precedence (identical for every agent)

1. `rules/` are canonical engineering law — they win any conflict with mirrors, skills, or docs.
2. `skills/` are procedures that apply the rules — they never override them.
3. `/CLAUDE.md` governance (SDLC phases, artifacts, gates) wins everything not covered by rules.
4. Where two rules overlap, the stricter wins.

## Hard lines no agent may cross

No inline reusable declarations in layer files · no clever/speculative code ([rules/28–29](../rules/28-simple-readable-code.md)) · no weakening privacy, AI safety, upload security, validation, a11y, i18n, or tests · no `eslint-disable`/`@ts-ignore` ever · no `--no-verify` / hook bypass · no payments, no biometrics, no image persistence · model/provider names env-driven only · every gate green before done is claimed.
