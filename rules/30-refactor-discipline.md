# 30 — Refactor Discipline & Agent Mirrors

> Refactors move code to its correct owner without changing behavior — and never weaken privacy, AI safety, upload security, validation, accessibility, i18n, tests, or gates. Agent mirror files stay compact, aligned, and defer to the canonical governance.

Related: [28-simple-readable-code.md](./28-simple-readable-code.md) · [29-reuse-before-creating.md](./29-reuse-before-creating.md) · [/skills/full-codebase-cleanup.md](../skills/full-codebase-cleanup.md) · [/skills/cleanup-without-weakening-safety.md](../skills/cleanup-without-weakening-safety.md)

---

## 1. Refactor by ownership, never randomly

Every refactor step follows the same loop:

1. Identify the finding's correct owner (constants → `.constants.ts`, types → `.types.ts`, enums → `.enum.ts`/`.enums.ts`, schemas → schema owner, DTOs → `api/dto/`, helpers → `lib/`, query keys → the frontend model owner).
2. Behavior changes? Write/adjust the test FIRST.
3. Move the declaration; update imports and public barrels; delete the duplicate.
4. Run the focused tests, then continue. Full gates before commit.

One concern per slice; small reviewable commits; never mix opportunistic rewrites into a move.

## 2. What a refactor must preserve, verbatim

- Image privacy: only extraction receives the photo; the buffer is wiped in `finally` immediately afterward; generation, judging, translation, sharing, and display are text-only; image data is never logged or persisted.
- Consent-first upload chain and every validation step ([15-file-upload-security.md](./15-file-upload-security.md)).
- AI safety: Zod validation + forbidden-wording filtering on EVERY provider output ([14-ai-safety.md](./14-ai-safety.md)).
- Error envelopes, messageKeys, redaction, rate limits, cleanup blocks, cancellation paths.
- Test intent: a refactor may restructure tests but never deletes coverage to pass.

Splitting a file that owns one of these behaviors requires re-running its focused suite plus the relevant integration suite before moving on.

## 3. Agent mirrors

- `CLAUDE.md` is the canonical governance file; `rules/` are the canonical engineering rules; `skills/` are procedures. **Rules win conflicts; governance wins the rest.**
- Mirror entrypoints (`AGENTS.md`, `CODEX.md`, `cursor.md`, `.cursorrules`, `.cursor/rules/`, `KIMI.md`, `GEMINI.md`, `GLM.md`, `QWEN.md`, `DEEPSEEK.md`, `OPENAI.md`, `ANTHROPIC.md`, `MISTRAL.md`) are compact bootstraps: they state the Simple Code Ladder, the never-weaken list, and POINT to the canonical files. They never carry full rule bodies and never drift — when a permanent rule changes, update the canonical file first, then every mirror in the same delivery stream.
- Every mirror must mention: the ladder, no inline declarations, reuse-before-create, no clever code, the privacy/AI-safety constraints, strict gates, and never bypassing hooks.
