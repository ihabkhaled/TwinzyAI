# Skill: Create DTO Validation

> Applies rules/21.

1. Define the Zod schema in modules/NAME/dto/ (or packages/shared if cross-side).
2. Derive the type via z.infer; never hand-write a parallel interface.
3. Validate at the boundary (pipe/manager entry); reject with VALIDATION_FAILED.
4. Test accept/reject cases including boundary values.
Gate: npm run lint && npm run typecheck && npm run test:unit && npm run build
