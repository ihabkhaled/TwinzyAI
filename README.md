# Twinzy

A **free**, mobile-first, privacy-safe AI game. Upload a photo, get playful public style/vibe
matches based on **written visible traits only** — no face recognition, no identity matching,
no biometric comparison, and your photo is never stored.

## How it works

1. The frontend uploads one image + a consent flag to `POST /api/v1/game/analyze`.
2. The backend validates the file (size, MIME, extension, magic bytes, decode, optional ClamAV).
3. Gemini extracts **15 visible, non-identifying traits** from the image (`use-1st-prompt`).
4. The image buffer is destroyed immediately after.
5. Gemini receives the **written traits only** and suggests 1–5 playful candidates (`use-2nd-prompt`).
6. A judge pass re-scores and filters (`use-3rd-prompt`) — max 4 safe final results.
7. The frontend shows traits, results, and a permanent disclaimer.

## Quick start

```bash
cp .env.example .env       # fill GEMINI_API_KEY and GEMINI_MODEL
npm install
npm run dev                # web on :3000, api on :3001
```

## Docker

```bash
npm run docker:up
npm run docker:down
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Run web + api in watch mode |
| `npm run lint` / `lint:fix` | ESLint (strict + custom architecture rules) |
| `npm run typecheck` | Strict TypeScript across all workspaces |
| `npm run test` / `test:unit` / `test:integration` / `test:e2e` | Vitest / Playwright suites |
| `npm run test:coverage` | Coverage report |
| `npm run build` | Build shared → api → web |
| `npm run validate` | lint + typecheck + coverage + build |

## Repository map

```
apps/web          Next.js App Router frontend (PWA, mobile-first)
apps/api          NestJS backend (game pipeline, Gemini adapter, file security)
packages/shared   Shared constants/types/enums/interfaces/schemas/utils
eslint/           Split flat config + custom architecture ESLint plugin
docs/ rules/ skills/ memory/ context/   Knowledge base (start at AGENTS.md)
```

## Documentation

Start at [AGENTS.md](AGENTS.md). Architecture: [docs/architecture.md](docs/architecture.md).
Env vars: [docs/env-vars.md](docs/env-vars.md). Security: [SECURITY.md](SECURITY.md).
