# Skill: Add an API Service Method (backend)

> Applies rules/19. One focused capability per service.

1. Add the method to the owning service in `application/`; keep it ≤ 20 lines; extract
   helpers to `lib/`.
2. Types/DTOs in their folders (`model/`, `api/dto/`); validate external input with Zod
   before use.
3. Map failures to a typed `AppError` with a stable `messageKey` (`errors.NAME.<key>`).
4. Unit test (mock collaborators) covering success + each failure path.
5. If the flow changes, update the owning use case and its tests too.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
