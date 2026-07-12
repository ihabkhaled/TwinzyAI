---
id: quality-architecture-review-standard
title: Architecture Review Standard
type: quality
authority: canonical
status: current
owner: repository owner
summary: How architecture fit is reviewed — against the architecture map and non-negotiable rules, recorded in phase-08 artifacts and ADRs, with boundaries mechanically enforced by lint.
keywords: [architecture, review, adr, boundaries, layers, phase-08, enforcement, standard]
contextTier: 2
relatedCode: [eslint.config.mjs, eslint/frontend/architecture.config.mjs]
relatedTests: []
relatedDocs: [context/architecture-map.md, architecture/adrs/README.md, rules/01-architecture.md, docs/eslint-architecture.md]
readWhen: You are reviewing a change for architecture fit or deciding whether it needs an ADR.
---

# Architecture Review Standard

## The canon being reviewed against

[context/architecture-map.md](../context/architecture-map.md) and
[rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md) are the engineering
canon; when other engineering docs contradict them, those two win (CLAUDE.md precedence).
Layer rule bodies: [rules/01-architecture.md](../rules/01-architecture.md) and
[rules/16-backend-architecture.md](../rules/16-backend-architecture.md); frontend anatomy per
[architecture/adrs/adr-fe-0001-strict-next-architecture.md](../architecture/adrs/adr-fe-0001-strict-next-architecture.md).

## What the reviewer checks (CLAUDE.md phase 08)

1. **Fit or intentional evolution** — the change either fits the current architecture or
   evolves it deliberately with traceability (an ADR).
2. **Boundary changes** — layer direction stays one-way
   (Controller → Application → Domain → Persistence → Integration;
   [docs/backend-architecture.md](../docs/backend-architecture.md)); vendors stay behind their
   single swap surfaces; new libraries follow
   [docs/library-wrapping.md](../docs/library-wrapping.md).
3. **Contract changes** — shared contracts in `packages/shared` change once, with both
   consumers updated in the same stream (CLAUDE.md shared-standards rules).
4. **Product-invariant impact** — the image boundary (only trait extraction sees the photo),
   statelessness, and the env-only paywall lever are architecture properties; weakening any of
   them is an owner decision, not a review call (CLAUDE.md Twinzy Product Constraints).
5. **Artifact** — findings land in the feature folder's `08-architecture-review.md`
   ([docs/features/README.md](../docs/features/README.md)).

## When an ADR is required

New load-bearing choices (framework, layer, vendor, scaling posture, validation vendor) get an
ADR in [architecture/adrs/](../architecture/adrs/README.md) (numbering: backend `adr-NNN`,
frontend `adr-fe-NNNN`; start from `adr-template.md`). Existing precedent: ADR-001 (engineering
OS), ADR-002 (Zod as the single validation vendor), ADR-003 (single-process scaling deferral),
ADR-FE-0001/0002.

## Mechanical backstop

Most boundary rules are lint-enforced at error level, so review focuses on intent, not policing:
backend plugin catalog in [docs/eslint-architecture.md](../docs/eslint-architecture.md), the 13
frontend rules in [docs/eslint/README.md](../docs/eslint/README.md), registered by
[eslint.config.mjs](../eslint.config.mjs) and
[eslint/frontend/architecture.config.mjs](../eslint/frontend/architecture.config.mjs). A lint
rule firing means the code is wrong or in the wrong layer — never silence it (CLAUDE.md).

## Merge block

Undocumented architecture impact blocks merge (CLAUDE.md Merge Rules). "No architecture
impact" is a valid review outcome only when stated explicitly.
