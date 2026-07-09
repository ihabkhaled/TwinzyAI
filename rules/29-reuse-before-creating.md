# 29 — Reuse Before Creating (YAGNI & Minimalism)

> Every new constant, type, helper, service, hook, component, wrapper, or abstraction must first prove that TwinzyAI does not already own it. Duplication is a defect; speculation is a defect. Extends the search-then-extend workflow of [05-types-enums-constants.md](./05-types-enums-constants.md) to ALL code.

Related: [28-simple-readable-code.md](./28-simple-readable-code.md) · [10-library-modularization.md](./10-library-modularization.md) · [/context/declaration-ownership-map.md](../context/declaration-ownership-map.md) · [/context/codebase-navigation.md](../context/codebase-navigation.md)

---

## 1. Search-then-extend (mandatory workflow)

Before writing anything reusable:

1. **Grep for the concept** (name, value, and synonyms) across `packages/shared`, the feature's `model//lib/`, `core/`, and `apps/web/src/packages`.
2. **Found an owner?** Extend it — even when the extension is slightly awkward. Two half-owners are worse than one imperfect owner.
3. **Found a near-duplicate?** Consolidate FIRST (move both call sites to one owner), then add your change.
4. **Nothing exists?** Create it in the correct owner per the [declaration-ownership map](../context/declaration-ownership-map.md) — never inline in a layer file.

## 2. YAGNI

- No abstraction for a single caller. No "we might need it later" parameters, options, flags, or generics.
- No new wrapper when an approved wrapper already owns the vendor ([10-library-modularization.md](./10-library-modularization.md)); no new dependency when the platform or an existing dependency solves it.
- No parallel implementations "to compare later"; no config surface nothing reads (config keys ship WITH their consumer — [25-configuration-and-environment.md](./25-configuration-and-environment.md)).
- Delete code the moment it loses its last caller — knip (`npm run quality:dead-code`) is the sweep tool; dead exports found there are removals, not TODOs.

## 3. When creating IS right

Create a new owner when: the concept genuinely has no home; the second real consumer just appeared (extract-on-second-use); a layer/security/provider boundary demands isolation; or testability requires a seam. Name it by ownership (rule 05 naming), export it through the module's intended surface, and document it if it is a shared module ([10 §docs](./10-library-modularization.md)).
