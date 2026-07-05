# CODEX.md — Compact Mirror

Canonical entry point: **`AGENTS.md`**. Full rule bodies: **`rules/`** (rules win all conflicts).
Task guides: **`skills/`**. Past decisions: **`memory/`**. Orientation: **`context/`**.

Do not duplicate rule bodies here. Short form of the non-negotiables:

- No `any`, no `eslint-disable`, no `@ts-ignore`, no non-null assertion `!`.
- No TypeScript `enum` — `as const` objects + derived types.
- No inline domain definitions (types/interfaces/constants/DTOs/schemas live in dedicated folders).
- TSX is pure composition — state/effects/handlers live in hooks, logic in lib/services.
- Backend: Controller → Manager → Service → Repository. Controllers delegate exactly one manager call.
- Frontend: Component → Hook → Service → Gateway.
- All libraries wrapped; no raw SDK/fetch/axios/storage imports in business code.
- No `process.env` outside config modules.
- No face recognition, no identity matching, no biometric anything, no image storage.
- Only the trait-extraction prompt sees the image; candidate/judge prompts are text-only.
- `GEMINI_MODEL` comes from `.env` — never hardcode.
- The game is free — never add payment logic.
- Do not commit or push unless asked.
- Quality gates before "done": `npm run lint && npm run typecheck && npm run test:unit && npm run build`.
