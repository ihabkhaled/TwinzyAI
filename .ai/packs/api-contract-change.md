<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: Endpoint shapes, shared schemas, DTOs, SSE events

Task type: `api-contract-change` · Lane: **critical** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- packages/shared schemas are the single source; api DTOs and web types derive from them.
- Breaking changes are first-class events — version or stage them, never slip them.
- Transport validation is server-side; clients are never trusted to enforce bounds.

## Must-read docs

- context/declaration-ownership-map.md — The one answer sheet for "where does X live?". Search-then-extend ([rules/29](../rules/29-reuse-before-creating.md)): if the owner exists, extend it; never create a parallel owner. Enforced mechanically by `architecture/no-inline-domain-... (~838 tokens)
- rules/21-dto-validation.md — > Validate **every** boundary with a zod schema before anything reaches the application layer. **Zod is the validation vendor; `class-validator` and `class-transformer` are forbidden repo-wide.** DTO schemas live in `api/dto/` backed by ... (~1556 tokens)

## Rules

- rules/21-dto-validation.md — > Validate **every** boundary with a zod schema before anything reaches the application layer. **Zod is the validation vendor; `class-validator` and `class-transformer` are forbidden repo-wide.** DTO schemas live in `api/dto/` backed by ... (~1556 tokens)
- rules/05-types-enums-constants.md — > The zero-inline policy in depth. Every type, enum-map, and reusable constant lives in its own dedicated file; every domain value is an as-const member, never a raw string literal. **The TypeScript `enum` keyword is banned repo-wide** —... (~2326 tokens)

## Skills

- skills/create-dto-validation.md
- skills/add-api-service-method.md

## Reviewers

- agents/backend-architect.md
- agents/frontend-architect.md

## Code entrypoints

- `packages/shared/src/schemas/`
- `apps/api/src/modules/game/api/dto/`

## Validation before done

- `npm run validate`

## Notes

Update contracts/ docs and both-side consumers in one stream. SSE event shape changes count as contract changes (contracts/api/sse-events.md).
