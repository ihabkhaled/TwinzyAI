# Skill: Create a Controller (backend)

> Applies rules/18. Transport only.

1. modules/NAME/controllers/NAME.controller.ts; route decorators + pipes/guards only.
2. Each handler: bind request -> exactly one manager call -> return typed result.
3. DTO schemas in dto/; no inline shapes; no process.env; no SDK/repository imports.
4. Register in the module; add an integration test for the route.
Gate: npm run lint && npm run typecheck && npm run test:unit && npm run build
