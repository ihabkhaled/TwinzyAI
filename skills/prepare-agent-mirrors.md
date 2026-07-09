# Skill: Prepare / Update Agent Mirror Files

Keep every AI-agent entrypoint (Claude, Codex, Cursor, Kimi, Gemini, GLM, Qwen, DeepSeek, OpenAI, Anthropic, Mistral) compact, aligned, and pointing at the same canonical sources.

## Read first

- [rules/30-refactor-discipline.md](../rules/30-refactor-discipline.md) §3
- [/CLAUDE.md](../CLAUDE.md) "Tool Compatibility And Canonical File Rules"

## When to use

A permanent rule/policy changed; a new agent tool needs an entrypoint; mirrors drifted. When NOT to use: per-feature guidance (that lives in rules/skills/context, never in mirrors).

## Steps

1. Update the canonical file first: governance → `/CLAUDE.md`; engineering rules → `rules/`; procedures → `skills/`.
2. Every mirror stays a COMPACT bootstrap containing only: (a) the Simple Code Ladder one-liner, (b) the be-lazy-about-volume / never-lazy-about-safety sentence, (c) the precedence statement (rules canonical → skills procedures → governance wins the rest), (d) links to `/CLAUDE.md`, `rules/README.md`, `rules/00`, `rules/28–30`, `skills/README.md`, `context/architecture-map.md`, `context/declaration-ownership-map.md`, `memory/known-pitfalls.md`, and (e) the never-weaken list (privacy, AI safety, upload security, validation, a11y, i18n, tests, gates, hooks).
3. Apply the SAME text to every mirror in the same delivery stream — mirrors never diverge from each other.
4. Never paste full rule bodies into a mirror; never let a mirror contradict a rule; delete stale mirror content rather than patching around it.

## Checklist

- [ ] Canonical file updated before any mirror
- [ ] All mirrors carry identical bootstrap content + links
- [ ] No rule bodies duplicated into mirrors; no drift remains
- [ ] `.cursor/rules/index.mdc` and `AGENTS.md` reference the same canon

Related: [full-codebase-cleanup.md](./full-codebase-cleanup.md)
