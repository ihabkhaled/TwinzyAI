# Skill: Simplify Existing Code (Extract · Split · De-inline · Delete)

One procedure for the four cleanup moves: extracting declarations/helpers, splitting oversized units (services, use cases, adapters, hooks, components, containers, gateways), refactoring inline declarations to their owners, and removing unnecessary code.

## Read first

- [rules/30-refactor-discipline.md](../rules/30-refactor-discipline.md)
- [rules/05-types-enums-constants.md](../rules/05-types-enums-constants.md)
- [context/declaration-ownership-map.md](../context/declaration-ownership-map.md)

## When to use

A file exceeds its size discipline, carries inline reusable declarations, duplicates logic that exists elsewhere, or contains code with no caller. When NOT to use: mid-feature — land the feature first, then simplify in its own slice; and never "simplify" a safety/privacy behavior (see [cleanup-without-weakening-safety.md](./cleanup-without-weakening-safety.md)).

## Steps

1. Read the whole file and its tests; list what it actually owns.
2. For each inline declaration: find/create the correct owner (constants → `.constants.ts`, types → `.types.ts`, enums → `.enum.ts`, schemas → schema owner, DTOs → `api/dto/`, query keys → frontend model owner) — extend an existing owner before creating a new file.
3. For splits: cut along RESPONSIBILITY, not line count — one capability per service/hook, one visual region per component, pure decisions out to `lib//domain/`. The split parts get intention-revealing names.
4. For duplicates: pick the surviving owner, point every call site at it, delete the rest in the same slice.
5. For dead code: confirm zero callers (grep + `npm run quality:dead-code`), then delete — no commenting out, no "keep just in case".
6. Behavior unchanged? Existing tests must pass untouched. Behavior changed? Tests first.
7. Update imports + barrels; run the focused suite; full gates before commit; one concern per commit.

## Checklist

- [ ] Every moved declaration has exactly one owner afterwards
- [ ] Splits follow responsibility; each part junior-readable in one pass
- [ ] Zero deleted coverage; cleanup/`finally`/abort paths preserved verbatim
- [ ] knip/madge clean for the touched area; gates green

Related: [write-simple-readable-code.md](./write-simple-readable-code.md) · [full-codebase-cleanup.md](./full-codebase-cleanup.md) · [cleanup-without-weakening-safety.md](./cleanup-without-weakening-safety.md)
