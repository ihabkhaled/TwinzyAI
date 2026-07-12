---
id: ai-provider-change-checklist
title: Provider Change Checklist
type: doc
authority: canonical
status: current
owner: repository owner
summary: Actionable checklist for adding, removing, or reconfiguring an AI provider — env, code touchpoints, tests, benchmark, safety review, docs, knowledge rebuild.
keywords: [ai, checklist, provider, adapter, env, rollout, rollback, change]
contextTier: 2
relatedCode: [apps/api/src/config/ai-provider.constants.ts, apps/api/src/modules/ai/adapters/provider-registry.service.ts, apps/api/src/modules/ai/adapters/openai-compat.adapter.ts]
relatedTests: [apps/api/src/modules/ai/tests/provider-registry.service.test.ts, apps/api/src/modules/ai/tests/openai-compat.adapter.test.ts]
relatedDocs: [docs/provider-routing.md, docs/ai/provider-catalog.md, docs/ai/model-change-checklist.md]
readWhen: You are about to add, remove, or reconfigure a provider — work through this list top to bottom.
---

# Provider Change Checklist

**Procedure owner:** [docs/provider-routing.md](../provider-routing.md) §"How to add a provider"
and §"Rollout / rollback". This checklist operationalizes it. SDLC phases still apply
(`CLAUDE.md`); provider changes touch an external integration, so treat them as
integration-risk work.

## Enable / disable an existing provider (config-only)

- [ ] Set/remove `<PROVIDER>_API_KEY` (key presence IS the enable flag —
      [provider-catalog.md](provider-catalog.md)); optionally `<PROVIDER>_BASE_URL`.
- [ ] Update `AI_ROUTE_<STEP>` chains to include/exclude the provider
      ([model-routing.md](model-routing.md)); remember extraction can only use Gemini entries
      (fail-closed vision).
- [ ] Boot the API and check the route boot-validation outcome (explicit route with zero usable
      entries throws).
- [ ] Update `.env.example` + [docs/env-vars.md](../env-vars.md) if the documented example
      changes; sync your local `.env`.
- [ ] Rollback lever ready: restoring the previous `AI_ROUTE_*` values is the whole rollback
      ([docs/provider-routing.md](../provider-routing.md)).

## Add a NEW provider (code + config)

- [ ] Read [docs/provider-routing.md](../provider-routing.md) §"How to add a provider" first.
- [ ] Add the id + env keys + default base URL in
      `apps/api/src/config/ai-provider.constants.ts`; add the env vars to
      `apps/api/src/config/env.schema.ts`.
- [ ] If it is OpenAI-chat-compatible, the shared `openai-compat.adapter.ts` serves it — no new
      adapter. Otherwise a new adapter must implement the port
      (`model/ai-provider-adapter.types.ts`) and be registered in
      `provider-registry.service.ts`; image methods MUST reject unless the owner explicitly
      approves a second vision provider (that decision changes the hardcoded fail-closed filter
      at `provider-registry.service.ts:82` — a product-safety change, not a config change).
- [ ] No direct SDK imports outside the adapter (library-wrapping rule —
      [docs/library-wrapping.md](../library-wrapping.md)).
- [ ] Extend `provider-registry.service.test.ts` (enablement, vision filter) and the adapter's
      test file; keep touched-module coverage ≥ 95%.

## Validate (both cases)

- [ ] `npm run test:ai` green; full gates: `npm run lint` · `npm run typecheck` ·
      `npm run test:coverage` · `npm run build`.
- [ ] `npm run ai:benchmark -- --mode=real` for the affected steps; compare axes
      ([benchmark-methodology.md](benchmark-methodology.md)).
- [ ] Trial on live traffic via shadow before flipping primaries
      ([shadow-routing.md](shadow-routing.md)).
- [ ] Safety review: new provider sees only what the step sends — text-only unless Gemini;
      confirm no new logging of prompt/response bodies beyond the redacted patterns
      ([prompt-injection-threat-model.md](prompt-injection-threat-model.md)).

## Document

- [ ] Update [provider-catalog.md](provider-catalog.md), `.env.example`,
      [docs/env-vars.md](../env-vars.md), and [docs/provider-routing.md](../provider-routing.md)
      if semantics changed; check [runbooks/ai-provider-outage.md](../../runbooks/ai-provider-outage.md)
      still matches.
- [ ] Rebuild the knowledge plane: `npm run knowledge:build`
      ([knowledge/README.md](../../knowledge/README.md)).
