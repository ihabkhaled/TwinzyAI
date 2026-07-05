# Skill: Create a Backend Service

> Applies rules/19.

1. modules/NAME/services/NAME.service.ts — one capability, small methods.
2. Collaborate with adapters through their interfaces; config via AppConfigService.
3. Extract complex logic to utils/ helpers; map failures to DomainException.
4. Unit tests: happy path + every failure mapping.
Gate: npm run lint && npm run typecheck && npm run test:unit && npm run build
