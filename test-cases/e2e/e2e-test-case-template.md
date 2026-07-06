# E2E Test Case Template

## Metadata

| Field | Value |
| --- | --- |
| Test case ID | |
| Related request ID | |
| Flow | e.g. upload → consent → analyze → result, error recovery, PWA/offline behavior |
| Automated equivalent | Playwright specs in `apps/web` — run via `npm run test:e2e` |
| Owner | |

## Objective

[What real player workflow is being validated, end to end through the browser. Standard: `testing/e2e-testing-standard.md`. Twinzy has no accounts or roles — every flow starts anonymous on the public app.]

## Preconditions

- [Precondition 1 — e.g. web + api running (`npm run dev` or `docker compose up --build`); synthetic fixture image available; AI provider stubbed or a test-safe configuration in place]

## Steps

1. [Player action 1 — e.g. open the game page, pick the fixture photo]
2. [Player action 2 — e.g. confirm consent, submit]

## Expected Result

[What the player sees: result card with playful style/vibe copy and the disclaimer, or a friendly error state. Nothing is persisted in this product — assert on the visible outcome, not stored data.]

## Negative / Recovery Checks

[Describe error, retry, or cancellation behavior checked — e.g. declining consent blocks submission with clear copy; oversize photo shows the friendly size message; AI unavailability shows a retry-later state without technical noise.]
