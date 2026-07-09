# cursor.md — Cursor Bootstrap Mirror

**Root `CLAUDE.md` is the canonical operating policy and is binding.** Read it fully before any
work. The active Cursor ruleset lives in `.cursor/rules/*.mdc`; this file is only a
human-readable pointer. If anything diverges, `CLAUDE.md` wins.

## Simple Code Ladder (permanent policy — rules/28–30)

Before writing code: need it → reuse existing owner → native/platform → existing wrapper/dependency → small helper → direct readable code → new abstraction only when justified. Be lazy about code volume, never about reading, validation, security, privacy, AI safety, file upload safety, tests, docs, observability, accessibility, i18n, or architecture. No inline reusable declarations in layer files; reuse before creating; no clever code. Never bypass hooks or gates. See [rules/28-simple-readable-code.md](rules/28-simple-readable-code.md) and [context/declaration-ownership-map.md](context/declaration-ownership-map.md).


Precedence: `CLAUDE.md` > `.cursor/rules/*.mdc` > `AGENTS.md` > `CODEX.md` / `cursor.md` >
`.cursorrules`. When two rules overlap, the stricter one applies.

## Mandatory first actions

1. Read root `CLAUDE.md` end to end (SDLC governance + engineering OS).
2. Read `AGENTS.md` (agent bootstrap: architecture map, product constraints, gates).
3. Read the request artifacts under `docs/features/<feature-slug>/` if they exist.
4. Read the baselines under `docs/sdlc/`, then the code and tests you will touch.
5. Read `memory/known-pitfalls.md`.

## Non-negotiable shape

- No phase skipping; no implementation before phases `00`–`13` are documented.
- Tests + docs ship in the same delivery stream as behavior (tests first).
- Coverage on touched modules, per file: 95 statements / 90 branches / 95 functions / 95 lines.
- Twinzy is a free game: no payments, no biometrics/identity matching, no image storage;
  only the trait-extraction prompt sees the image; `GEMINI_MODEL` from `.env`.
- Conventional commits via Husky hooks; never `--no-verify`; do not commit/push unless asked.

## Quality gates (all green before "done")

```bash
npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
```
