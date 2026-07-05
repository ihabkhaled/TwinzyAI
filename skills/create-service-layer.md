# Skill: Create a Frontend Service

> Applies rules/04.

1. features/NAME/services/NAME.service.ts — plain functions/objects, no React imports.
2. Validate inputs (model/schemas), call the gateway, map DTO -> view model via lib/mappers.
3. Surface typed errors the hook can translate to i18n messages.
4. Unit-test with a mocked gateway.
Gate: npm run lint && npm run typecheck && npm run test:unit && npm run build
