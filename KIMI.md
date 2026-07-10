# TwinzyAI — Kimi Agent Entrypoint

Compact bootstrap. The canonical sources win — read them before writing code.

## Before writing code, run the TwinzyAI Simple Code Ladder

need it → reuse existing → native/platform → existing wrapper/dependency → small helper → direct readable code → new abstraction only when justified.

Be lazy about code volume, never lazy about reading, validation, security, privacy, AI safety, file upload safety, tests, docs, observability, accessibility, i18n, or architecture.

## Precedence

Rules are canonical. Skills are procedures. If there is a conflict, rules win. If there is still a conflict, TwinzyAI's canonical architecture/governance file wins: [/CLAUDE.md](./CLAUDE.md).

## Read

- [CLAUDE.md](./CLAUDE.md) — canonical governance (SDLC phases, artifacts, gates)
- [rules/README.md](./rules/README.md) · [rules/00-non-negotiable-rules.md](./rules/00-non-negotiable-rules.md)
- [rules/28-simple-readable-code.md](./rules/28-simple-readable-code.md) · [rules/29-reuse-before-creating.md](./rules/29-reuse-before-creating.md) · [rules/30-refactor-discipline.md](./rules/30-refactor-discipline.md)
- [skills/README.md](./skills/README.md) · [skills/full-codebase-cleanup.md](./skills/full-codebase-cleanup.md)
- [context/architecture-map.md](./context/architecture-map.md) · [context/declaration-ownership-map.md](./context/declaration-ownership-map.md)
- [memory/known-pitfalls.md](./memory/known-pitfalls.md)

## Hard lines

No inline reusable declarations in layer files. Reuse before creating; no clever or speculative code. Never weaken: image privacy (only extraction receives the photo; downstream AI is text-only; no persistence; wipe-in-finally; never logged), consent-first upload validation, AI safety (Zod + forbidden-wording filtering on every provider output), no payments, no biometrics/face recognition, accessibility, i18n/RTL, strict TS/ESLint, tests. Never use eslint-disable/@ts-ignore. Never bypass hooks or gates (no --no-verify). All gates green before claiming done.
