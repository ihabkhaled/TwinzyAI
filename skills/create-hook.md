# Skill: Create a Hook

> Applies rules/03. Hooks orchestrate; lib computes.

1. Place in features/NAME/hooks or apps/web/src/hooks. Name useXxx.
2. Own state/effects/handlers; call services (never gateways); mutations via TanStack Query.
3. Extract non-trivial logic to features/NAME/lib pure functions (tested separately).
4. Return a single object consumed by the container component.
Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
