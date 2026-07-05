# Skill: Create a Manager (use case)

> Applies rules/17.

1. modules/NAME/managers/NAME.manager.ts — owns the workflow sequence.
2. Inject services only (never adapters/repositories/SDKs).
3. Put cleanup guarantees here (try/finally); managers own resource lifecycles.
4. Unit-test order-of-operations and failure short-circuits with mocked services.
Gate: npm run lint && npm run typecheck && npm run test:unit && npm run build
