# Skill: Create a Repository

> Applies rules/20. Persistence only. (Twinzy persists nothing today — read rules/20 before
> adding any persistence; images/biometrics are permanently banned.)

1. modules/NAME/repositories/NAME.repository.ts — typed queries only.
2. No business/AI/file decisions; pagination + documented indexes for lists.
3. Unit-test query building; integration-test against a real store if one exists.
Gate: npm run lint && npm run typecheck && npm run test:unit && npm run build
