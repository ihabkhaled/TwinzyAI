# Skill: Add / Swap an AI Provider

> Applies rules/10, 14. The provider is one adapter behind a port.

1. Implement AiProviderAdapter (extractTraitsFromImage, generateFromText) in modules/ai/adapters.
2. Wire selection in ai.module.ts via the port token; config decides the provider.
3. Never let vendor types cross the port; map errors to DomainException codes.
4. Register the SDK package in policy-utils.mjs SDK list (lint bans it outside adapters).
5. Reuse the same prompts/schemas/safety filters — provider change must not change contracts.
6. Add adapter tests (timeout, invalid JSON, error mapping, no image in text-only calls).
Gate: npm run lint && npm run typecheck && npm run test:ai && npm run build
