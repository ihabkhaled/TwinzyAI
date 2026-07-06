# Project Architecture — Standing Decision

> The layered, module-per-feature NestJS architecture is the **standing architectural decision**
> for this repo (adopted via [adr-001-strict-engineering-os.md](../architecture/adrs/adr-001-strict-engineering-os.md)).
> The authoritative diagram and tree live in [/context/architecture-map.md](../context/architecture-map.md);
> the hard rules in [/rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md).
> When in doubt, those two win. This is a convention you inherit, not a proposal to re-litigate.

## Decision

| Aspect | Decision |
| --- | --- |
| Topology | Modular monolith: one deployable Nest app (`apps/api`), split into feature modules with strict boundaries |
| Layering | Controller → Application (use case / service) → Domain → Infrastructure → Adapters; deps point downward only |
| Unit of work | The feature module: `apps/api/src/modules/<feature>/` |
| Module anatomy | `api/ · application/ · domain/ · infrastructure/ · adapters/ · model/ · lib/` (create folders by responsibility; not every module needs every folder) |
| Cross-cutting | `src/core/` (errors, logger, rate-limit, openapi, http types), `src/config/` (AppConfigService), `src/bootstrap/` (Fastify app assembly, plugin registration) |
| Shared contracts | `packages/shared` (`@twinzy/shared`) — zod schemas/constants compiled to a built dist consumed by both apps |
| Enforcement | Strict TS + custom `architecture/*` ESLint plugin (10 rules) + husky gates — not convention-by-hope |

## This project's module list

`apps/api/src/modules/{health, privacy, result-aggregation, file-security, ai, game}`

- **game** owns the analyze pipeline; its orchestrator is
  `application/analyze-game.use-case.ts` (the former manager — see
  [architecture-decisions.md](./architecture-decisions.md)).
- **ai** owns the Gemini adapter behind the AI provider port
  (`modules/ai/adapters/gemini.adapter.ts`, Symbol injection token, image-capable vs text-only
  method split — see [ai-safety-decisions.md](./ai-safety-decisions.md)).
- **file-security** owns upload validation + the ClamAV clamd INSTREAM adapter.
- **health** is transport + service only — its manager tier was dissolved (a trivial module no
  longer carries a pass-through layer).
- No `infrastructure/*.repository.ts` exists anywhere: nothing is persisted, by design
  ([database-decisions.md](./database-decisions.md)).

## Why this shape (rationale)

- **Boundaries make change cheap.** Controllers cannot import adapters or another module's
  internals; blast radius is bounded by construction.
- **Thin transport ages well.** Controllers delegate exactly once; the Express→Fastify platform
  swap touched bootstrap and core/http types, not business rules.
- **Adapters contain vendor risk.** Swapping Gemini or ClamAV touches one adapter, not the
  pipeline ([library-boundaries.md](./library-boundaries.md)).
- **Privacy by construction.** With no persistence layer and a text-only AI port for everything
  after trait extraction, the privacy invariants are structural, not aspirational.

## Import boundaries (mechanically enforced)

The custom ESLint architecture plugin enforces the layer rules; vendor ownership is
**config-driven** via `eslint/package-boundaries.config.mjs` — every wrapped package is listed
with its sole owning directory, so a stray vendor import in business code is a lint error, not a
review comment. `process.env` is legal only in `src/config/` (and bootstrap wiring). See
[/rules/11-eslint-typescript.md](../rules/11-eslint-typescript.md) and
[/rules/01-architecture.md](../rules/01-architecture.md).

## Coexistence rule (standing)

A parallel frontend workstream owns `apps/web`. Backend/architecture work never edits
`apps/web`, and **root-level config changes must stay additive** so neither workstream breaks
the other.

## When to revisit

Reopen only with a written ADR under [/architecture/adrs/](../architecture/adrs/README.md):
module extraction to a separate service, a non-HTTP primary transport, or the modular monolith
no longer fitting. Adding a feature or swapping a vendor never requires reopening this note.
