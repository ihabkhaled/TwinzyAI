# Skill: Add an API Service Method (backend)

> Applies rules/19. One focused capability per service.

1. Add the method to the owning service; keep it small; extract helpers to utils/.
2. Types/DTOs in their folders; validate external input with Zod before use.
3. Map failures to DomainException with a stable ErrorCode.
4. Unit test (mock collaborators) covering success + each failure path.
5. If the flow changes, update the manager and its tests too.
Gate: npm run lint && npm run typecheck && npm run test:unit && npm run build
