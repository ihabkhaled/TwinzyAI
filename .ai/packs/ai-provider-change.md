<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: Provider adapters, routing chains, fallback/shadow

Task type: `ai-provider-change` · Lane: **critical** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- New vendors get an adapter implementing AiProviderAdapter; no SDK imports outside adapters.
- Photo-carrying calls dispatch only to vision-capable entries (fail-closed).
- Provider errors are classified (rate-limited/unavailable/fatal) and redacted before logging.
- Routing chains are env-only (AI_ROUTE_*); boot validates explicit routes.

## Must-read docs

- docs/provider-routing.md — TwinzyAI routes each AI pipeline step (trait **extraction**, candidate **generation**, **judge**, result **translation**) through a provider-agnostic router, so every step can run on the provider/model that fits its difficulty — with cro... (~1253 tokens)
- docs/ai-benchmarking.md — `npm run ai:benchmark` measures provider/model candidates per pipeline step with the SAME validators production uses (step Zod schemas + forbidden-wording scan), and writes a markdown + JSON report under `benchmark-results/run-<mode>-<ti... (~502 tokens)
- context/ai-context.md — Pipeline (backend only; the frontend never calls an AI provider): (~252 tokens)

## Rules

- rules/14-ai-safety.md — > Related: [00-non-negotiable-rules.md](./00-non-negotiable-rules.md) (rules 43–46) · [15-file-upload-security.md](./15-file-upload-security.md) · [17-manager-layer.md](./17-manager-layer.md) (the analyze pipeline) · [26-error-handling-a... (~419 tokens)
- rules/10-library-modularization.md — > Every external library that touches product behavior is owned by **exactly one adapter/module**. Business code depends on *our* interface — never the vendor SDK. Swapping a vendor touches one folder. Implements rules 30 and 39 of [00-n... (~1544 tokens)
- rules/25-configuration-and-environment.md — > All configuration is typed, zod-validated at startup, and read through `@nestjs/config` behind **`AppConfigService` — the only injectable config surface**. `process.env` never appears outside `config/` and `bootstrap/` (ESLint-enforced... (~1399 tokens)

## Skills

- skills/add-ai-provider.md

## Reviewers

- agents/backend-architect.md
- agents/reliability-engineer.md

## Code entrypoints

- `apps/api/src/modules/ai/adapters/`

## Validation before done

- `npm run test:ai`
- `npm run ai:benchmark`

## Notes

Follow skills/add-ai-provider.md. OpenAI-compatible vendors reuse OpenAiCompatAdapter via registry config instead of new adapters when the wire format matches. Run npm run ai:benchmark before and after.
