# Skill: Write Simple Readable Code

Apply the Simple Code Ladder to any new code so the result is boring, obvious, and junior-readable — while keeping every safety, privacy, validation, a11y, and i18n guarantee intact.

## Read first

- [rules/28-simple-readable-code.md](../rules/28-simple-readable-code.md)
- [rules/29-reuse-before-creating.md](../rules/29-reuse-before-creating.md)
- [context/declaration-ownership-map.md](../context/declaration-ownership-map.md)

## When to use

Every time you write code. When NOT to use: never — but the ladder decides *what* to write, it never skips reading, tests, or gates.

## Steps

1. Read the real code around the change first (the ladder runs on knowledge, not guesses).
2. Run the ladder: (a) does this need to exist? (b) does an owner already exist — grep names, values, synonyms; (c) platform-native solution? (d) existing wrapper/adapter/gateway/hook? (e) small pure helper in the right `lib/`/`model/`/shared owner? (f) direct readable code? (g) only then a new abstraction with a real current justification.
3. Write the direct version: early returns over nesting, named helpers over dense chains, plain types over clever generics, no nested ternaries, no single-consumer abstractions.
4. Put every declaration in its owner (constants/types/enums/schemas/DTOs/query-keys) — nothing reusable inline in a layer file.
5. Tests first when behavior changes; focused suite after; full gates before commit.

## Checklist

- [ ] Ladder ran; existing owners searched before creating anything
- [ ] No inline reusable declarations; no duplicates introduced
- [ ] No clever one-liners, nested ternaries, or speculative abstractions
- [ ] Privacy / AI safety / upload validation / a11y / i18n untouched or strengthened
- [ ] Tests + gates green (`npm run lint · typecheck · test:coverage · build`)

Related: [simplify-existing-code.md](./simplify-existing-code.md) · [full-codebase-cleanup.md](./full-codebase-cleanup.md)
