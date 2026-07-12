<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: Env vars, config schema, toggles

Task type: `configuration-change` · Lane: **standard** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- Every new key: env.schema.ts (zod, fail-fast) → app-config.service.ts getter → .env.example with comment → docs/env-vars.md.
- Web-visible values use NEXT_PUBLIC_* via packages/env — never leak server secrets.
- No process.env reads outside the config layer.

## Must-read docs

- docs/env-vars.md — | Var | Side | Default | Notes | (~683 tokens)
- rules/25-configuration-and-environment.md — > All configuration is typed, zod-validated at startup, and read through `@nestjs/config` behind **`AppConfigService` — the only injectable config surface**. `process.env` never appears outside `config/` and `bootstrap/` (ESLint-enforced... (~1399 tokens)

## Rules

- rules/25-configuration-and-environment.md — > All configuration is typed, zod-validated at startup, and read through `@nestjs/config` behind **`AppConfigService` — the only injectable config surface**. `process.env` never appears outside `config/` and `bootstrap/` (ESLint-enforced... (~1399 tokens)

## Skills

- skills/add-config-value.md

## Reviewers

- agents/backend-release-gatekeeper.md

## Code entrypoints

- `apps/api/src/config/`
- `apps/web/src/packages/env/`
- `.env.example`

## Validation before done

- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run security:scan:secrets`

## Notes

Follow skills/add-config-value.md. Mirror pairs (like the payment price) must stay consistent; knowledge:contradictions checks the price mirror.
