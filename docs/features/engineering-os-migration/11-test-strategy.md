# 11 — Test Strategy

- **Safety net:** existing api unit + integration suites define behavior; they must pass after every slice (adapted only where internals moved).
- **New tests written first per slice:** core/errors mapper+filter specs; core/validation flattening spec; core/logger AppLogger spec; bootstrap e2e parity (health 200 + helmet header, analyze 400 consent, 404 unknown route, 413 oversize, envelope shape incl. messageKey); config fail-fast spec; multipart behavior (single file, extra file rejection, field extraction).
- **Layers:** unit (vitest project api-unit), integration (api-integration, full Nest app via supertest), lint-rules (plugin RuleTester), smoke (real boot + curl evidence).
- **Negative/edge:** oversize upload, wrong MIME, magic-byte mismatch, provider timeout, unsafe AI output, rate-limit 429.
- **Environments:** local node 24; no external services (Gemini mocked via FakeAiAdapter; ClamAV disabled/stubbed).
- **Evidence:** command outputs captured in 15-dev-validation-report.md.
