# Skill: Touch File-Upload Code Safely

> Applies rules/15. The riskiest area of the codebase.

1. Read rules/15 and docs/file-upload-security.md first.
2. Any new check joins the ordered chain in `FileSecurityService`
   (`apps/api/src/modules/file-security/application/file-security.service.ts`) — never a
   side channel. Consent is asserted before any byte is inspected.
3. Preserve invariants: memory-only, wipe in `finally`, never log/persist/return bytes;
   scanner failures fail closed in production.
4. Add TEST_CASES.md entries + tests for every new accept/reject behavior BEFORE coding.
5. Re-run the focused suite while iterating: `npm run test:file-security`.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
