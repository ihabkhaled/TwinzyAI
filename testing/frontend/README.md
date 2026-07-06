# Frontend Testing Standards (`apps/web`)

Normative testing documentation for the Twinzy frontend (`apps/web`, Next.js 16). These documents
define how every frontend test is written, where it lives, and which gates it must pass. They are a
**parallel track** to the backend testing standards in the flat [`testing/`](../README.md) folder
(which govern the NestJS backend in `apps/api`). The rulebook summary lives in
[rules/frontend/15-testing-and-coverage.md](../../rules/frontend/15-testing-and-coverage.md);
step-by-step authoring workflows live in the [skills/](../../skills/README.md) catalog.

## Toolchain (fixed — never substitute)

- **Unit + integration:** Vitest 4 + React Testing Library + jsdom, with MSW v2 for network
  (owner: `apps/web/src/tests/msw`).
- **E2e / accessibility / visual:** Playwright, against the production build with the mocked BFF
  gateway. Accessibility uses `@axe-core/playwright`.
- **Coverage provider:** v8 — 95% global, 100% for `utils/`, `helpers/`, `mappers/`, `schemas/`,
  and query-key builder files.
- **Test file suffixes:** `*.test.ts` / `*.test.tsx` (Vitest), `*.e2e.ts`, `*.a11y.ts`,
  `*.visual.ts` (Playwright).

## Index

| Document                                                               | Covers                                                                                                  |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [testing-strategy.md](testing-strategy.md)                             | The test pyramid for the frontend, what each layer owns, and the TDD workflow.                          |
| [unit-testing-standard.md](unit-testing-standard.md)                   | Vitest unit tests: naming, module `test/` directories, table-driven style, pure-logic branch coverage. |
| [integration-testing-standard.md](integration-testing-standard.md)     | Cross-layer tests with `renderWithProviders`, the MSW server lifecycle, and user-event discipline.     |
| [e2e-testing-standard.md](e2e-testing-standard.md)                     | Playwright end-to-end tests against the production build with the mocked BFF gateway.                   |
| [accessibility-testing-standard.md](accessibility-testing-standard.md) | Automated axe gates, keyboard specs, and the manual checklist that complements them.                   |
| [visual-testing-standard.md](visual-testing-standard.md)               | Screenshot policy: viewports, LTR/RTL, dark mode, diff tolerance, baseline management.                  |
| [coverage-policy.md](coverage-policy.md)                               | Exact thresholds from the Vitest config, exclusions, and the no-fake-coverage doctrine.                |
| [test-data-and-fixtures.md](test-data-and-fixtures.md)                 | Factories, module mock fixtures, MSW handlers as API truth, no inline magic data.                       |
| [quality-gates.md](quality-gates.md)                                   | Gate → npm script → CI job → blocking status, including git hooks.                                      |

## Ground rules that apply to every document above

- Tests are part of the definition of done. A frontend feature without tests at every applicable
  layer does not merge.
- `.only` never ships; skipped tests require a documented, reviewed exception (recorded in the
  feature's QA/security artifact or an ADR under [architecture/adrs/](../../architecture/adrs/README.md)).
- Test ids come from `TEST_IDS` in `apps/web/src/shared/constants` — raw testid strings are a
  violation in both components and specs.
- Twinzy privacy holds in tests too: fixtures are **text-only** trait/match data; no test persists,
  logs, or asserts storage of an uploaded image.
- The rationale behind these choices is recorded in
  [memory/frontend/testing-strategy.md](../../memory/frontend/testing-strategy.md).
