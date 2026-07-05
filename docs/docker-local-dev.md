# Docker & Local Development

Local (no Docker):
    cp .env.example .env   # set GEMINI_API_KEY, GEMINI_MODEL
    npm install
    npm run dev            # web :3000, api :3001

Docker (production images):
    npm run docker:up      # builds Dockerfile.web + Dockerfile.api, starts compose
    npm run docker:logs
    npm run docker:down

Both images: multi-stage, non-root user, healthchecks, no secrets baked, no upload volumes.
ClamAV: docker compose --profile clamav up -d and set ENABLE_CLAMAV=true.
Dev compose: docker compose -f docker-compose.dev.yml up (source-mounted watch mode).
Real-Gemini e2e (manual): export GEMINI_API_KEY/GEMINI_MODEL, start api without mocks, then run
Playwright with E2E_REAL_BACKEND=true (see apps/web/e2e/README note in playwright.config.ts).
