# Skill: Create a Component

> Applies rules/02. Pure JSX composition only.

1. Place in components/ui (generic) or features/NAME/ui (feature-specific). PascalCase.tsx.
2. Declare one XxxProps interface (only allowed local declaration).
3. Render props only: no hooks, handlers, computations, fetches, or nested ternaries.
4. Accessibility: label/role/alt; touch target min-h-12 for actions; both themes.
5. Strings via t(). 6. Render test asserting behavior (visible text, roles, attributes).
Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
