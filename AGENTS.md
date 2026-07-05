# AGENTS.md — Canonical Agent Entry Point

Read this first. If anything conflicts, **`rules/` wins**.

## Project purpose

Twinzy is a **free**, mobile-first, privacy-safe AI game. A user uploads one photo; the backend
uses Google Gemini to extract 15 visible, non-identifying appearance traits (text), then uses those
**written traits only** to suggest playful public style/vibe matches. Entertainment only.

The app is NEVER: face recognition, identity matching, biometric comparison, exact lookalike
matching, or serious facial similarity analysis.

The app NEVER stores: uploaded images, face embeddings, biometric templates, or raw image bytes.

There are NO payments. Do not add payment logic.

## Stack

- Frontend: Next.js (App Router) + React + Tailwind CSS + TanStack Query + React Hook Form + Zod
- Backend: NestJS + Zod + Google Gemini via `GeminiAdapter` only
- Shared: `packages/shared` (constants/types/enums/interfaces/schemas/utils)
- Tooling: TypeScript strict, ESLint flat config + custom architecture plugin, Prettier, Husky,
  lint-staged, Vitest, Playwright, Docker + Docker Compose, npm workspaces

## Mandatory workflow

1. Read the relevant `rules/` files before changing code (start: `rules/00-non-negotiable-rules.md`).
2. Use `skills/` guides for repeatable tasks (create feature, controller, hook, tests...).
3. Check `memory/` for decisions already made; do not re-litigate them silently.
4. Write/update tests with the change (tests first for new behavior).
5. Run quality gates before claiming done.

## Quality gates

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:coverage
npm run build
```

All must pass. Never weaken a rule, skip a test, or loosen tsconfig/eslint to get green.

## Non-negotiable rules (summary — full text in rules/)

- No `any`, no `eslint-disable`, no `@ts-ignore`, no `@ts-expect-error`, no non-null assertion `!`.
- No TypeScript `enum` — use `as const` objects + derived types.
- No inline domain types/interfaces/constants/DTOs/schemas — dedicated folders.
- TSX is pure JSX composition: no `useState`/`useEffect`/handlers/logic in components.
- Backend: `Controller → Manager → Service → Repository`. Controllers delegate one manager call.
- Frontend: `Component → Hook → Service → Gateway → Backend`.
- Every third-party library is wrapped (adapter/lib). No raw SDK/`fetch`/`axios`/storage in business code.
- No `process.env` outside the config module (`apps/api/src/config`, `apps/web/src/lib/config`).
- All user-facing strings go through i18n (`apps/web/src/i18n`).

## Architecture map

```
apps/web  — Next.js UI  (app/ components/ features/ hooks/ services/ gateways/ lib/ i18n/ ...)
apps/api  — NestJS API  (modules/{health,game,ai,file-security,result-aggregation,privacy} config/ common/ infrastructure/)
packages/shared — cross-side constants/types/enums/interfaces/schemas/utils
eslint/   — split flat config + custom architecture plugin
docs/ rules/ skills/ memory/ context/ — knowledge base
```

## AI-safety rules

- Only the trait-extraction prompt (`use-1st-prompt.md`) may receive the image.
- Candidate and judge prompts receive **text only** (traits JSON / candidates JSON).
- No face embeddings, no biometric templates, no identity claims, no "you look exactly like X".
- Gemini model name comes from `.env` (`GEMINI_MODEL`); never hardcode it.
- Every Gemini response is Zod-validated and safety-filtered before use.
- Reject/sanitize outputs containing forbidden wording (see `packages/shared/src/constants/safety.constants.ts`).

## File-upload rules

- Backend is the source of truth: consent flag required; one file only; size, MIME, extension,
  extension/MIME consistency, magic bytes, decode check; optional ClamAV (fail closed in prod).
- Image lives in memory only; buffer wiped in `finally`; never logged; never persisted; never returned.

## Release checklist

See `rules/24-release-gate.md` and `docs/release-checklist.md`. Short form: all quality gates
green, Docker up/down clean, no forbidden wording in UI, no secrets in frontend bundle, docs
updated.

## Git etiquette

Do not commit or push unless explicitly asked.
