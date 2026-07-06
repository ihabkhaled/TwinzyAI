# Frontend Context

Orientation documents for the Twinzy **frontend** operating system (`apps/web`). This is a second,
parallel track to the backend OS: the repository-root flat [`context/`](../) and [`memory/`](../../memory/)
folders describe the NestJS backend (`apps/api`); this `context/frontend/` track (and its sibling
[`memory/frontend/`](../../memory/frontend/) and [`rules/frontend/`](../../rules/frontend/)) describes
the Next.js frontend. When a rule and a context document disagree, the rule wins and the context
document has a bug. Adapted from the reference frontend OS.

## Read order (new to the frontend?)

1. Root [`CLAUDE.md`](../../CLAUDE.md) — the standing governance brain: request classification, SDLC
   phases 00–27, artifacts, and hard gates that apply to **both** tracks.
2. [`context/frontend/architecture-map.md`](./architecture-map.md) — the annotated `apps/web/src`
   tree, the one-way layer dependency diagram, and the import policy table.
3. [`rules/frontend/00-non-negotiable-rules.md`](../../rules/frontend/00-non-negotiable-rules.md) —
   the frontend engineering canon; if any other frontend doc contradicts it, that rule wins.
4. [`context/frontend/codebase-navigation.md`](./codebase-navigation.md) — task-to-location lookup
   ("where do I put X"), file-suffix conventions, and the path-alias map.
5. [`context/frontend/stack-and-toolchain.md`](./stack-and-toolchain.md) — every dependency, why it
   was chosen, and which wrapper owns it.

## Contents

| Document                                           | Purpose                                                                                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [architecture-map.md](./architecture-map.md)       | The canonical map: annotated `apps/web/src` tree, the one-way layer dependency diagram, and the `no-restricted-layer-imports` policy table. |
| [stack-and-toolchain.md](./stack-and-toolchain.md) | Every frontend dependency: version, why it was chosen, and which wrapper owns it.                                               |
| [codebase-navigation.md](./codebase-navigation.md) | Task-to-location lookup, file-suffix naming conventions, and the TypeScript path alias map.                                     |
| [package-boundaries.md](./package-boundaries.md)   | The vendor → owner wrapper → exports table mirroring the package-boundaries ESLint config, plus the procedure for a new vendor. |
| [reference-patterns.md](./reference-patterns.md)   | Canonical code shapes: component/container split, query-key builder, gateway→mapper→service chain, store, form, error mapping.  |
| [glossary.md](./glossary.md)                       | Definitions of frontend-specific terms: module, layer, owner wrapper, view model, wire type, BFF gateway, gate, exception.     |

## How to use this folder

1. New to the frontend? Follow the read order above.
2. About to import a third-party package? Check [package-boundaries.md](./package-boundaries.md)
   before writing the import.
3. About to write a new file? Copy the closest shape in [reference-patterns.md](./reference-patterns.md)
   and follow the matching [`rules/frontend/`](../../rules/frontend/) rule.
4. Confused by a term in a review comment? Look it up in [glossary.md](./glossary.md).
5. Weighing a settled trade-off (packages, testing bars, security, performance, i18n, a11y, tokens)?
   Read the matching decision file in [`memory/frontend/`](../../memory/frontend/) before re-opening it.

These documents MUST be kept in sync with `apps/web`. A change that moves a directory, adds a vendor,
or renames an alias without updating the matching context document fails review per
[`rules/frontend/20-review-checklist.md`](../../rules/frontend/20-review-checklist.md).
