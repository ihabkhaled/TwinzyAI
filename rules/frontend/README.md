# Frontend Rules (`apps/web`)

This folder is the **frontend engineering canon** for `apps/web` (the Next.js App Router client).
Every rule file uses MUST/never/always language and names the mechanism that enforces it (an
ESLint rule, a TypeScript compiler flag, a CI gate, or the review checklist). When a rule and the
code disagree, the code is wrong.

Start with [00-non-negotiable-rules.md](00-non-negotiable-rules.md); every other file expands on it.

## Where this fits in the repo

- **This folder (`rules/frontend/`) is the frontend canon** — it governs how code in `apps/web`
  must be written.
- **The flat `rules/` files `00`–`27` are the backend canon** — they govern `apps/api` (the NestJS
  backend) and the monorepo as a whole. The four legacy flat frontend stubs
  (`rules/02-frontend-components-tsx.md`, `03-frontend-hooks.md`, `04-frontend-services-gateways.md`,
  `13-accessibility.md`) are superseded for `apps/web` by this track and retained only for
  backend/monorepo cross-reference.
- **The shared SDLC governance is [`CLAUDE.md`](../../CLAUDE.md)** — the phases, artifacts, and hard
  gates every change (frontend or backend) must pass through.
- **When two tracks overlap, the stricter rule wins.** If any frontend rule here contradicts the
  `CLAUDE.md` governance policy, `CLAUDE.md` wins on lifecycle/governance; on how frontend code is
  written, this track is authoritative. The Twinzy product non-negotiables in `CLAUDE.md`
  (game is free, no biometrics, no image persistence, no `enum` keyword, `.env`-driven model, Zod +
  safety filtering, backend-verified uploads) are never relaxed by anything here.

| Rule                                                                     | Covers                                                                                             |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| [00-non-negotiable-rules.md](00-non-negotiable-rules.md)                 | The 20 non-negotiables — the contract every `apps/web` change is reviewed against.                 |
| [01-next-app-router-architecture.md](01-next-app-router-architecture.md) | App Router composition: route groups, page/layout/route conventions, server-first, `proxy.ts`.     |
| [02-components-and-containers.md](02-components-and-containers.md)        | JSX-only components, containers as the wiring layer, the view-model contract.                       |
| [03-hooks.md](03-hooks.md)                                               | Hooks as orchestrators that produce fully-translated view models.                                  |
| [04-services-api-gateway.md](04-services-api-gateway.md)                 | React-free services, Zod-parsed gateways, the BFF gateway route, mock mode.                         |
| [05-tanstack-query.md](05-tanstack-query.md)                             | Query-key builders, reusable options, exact invalidation, server state stays in the cache.         |
| [06-zustand.md](06-zustand.md)                                           | What client state is allowed in stores, store purity, selectors, effects hooks.                    |
| [07-types-enums-constants.md](07-types-enums-constants.md)               | `as const` enums, types-only files, the shared constants catalogs.                                 |
| [08-utils-helpers-mappers.md](08-utils-helpers-mappers.md)               | Utils vs helpers vs mappers vs schemas, and their 100% coverage bar.                               |
| [09-library-wrapping.md](09-library-wrapping.md)                         | One owning wrapper per vendor package under `apps/web/src/packages/`.                               |
| [10-eslint-typescript.md](10-eslint-typescript.md)                       | Flat-config layout, the custom `frontend-architecture` rules, strict TypeScript, tsgo.             |
| [11-security.md](11-security.md)                                         | CSP nonces, static headers, error sanitization, dependency scanning policy.                        |
| [12-performance.md](12-performance.md)                                   | Rendering discipline, memo boundaries, virtualization, bundle hygiene.                             |
| [13-accessibility.md](13-accessibility.md)                               | Landmarks, keyboard support, axe-clean requirement, `LANDMARK_IDS`.                                |
| [14-i18n-rtl.md](14-i18n-rtl.md)                                         | next-intl wrapper usage, en/ar catalogs, cookie locale, RTL via `dir`.                             |
| [15-testing-and-coverage.md](15-testing-and-coverage.md)                 | Test pyramid, MSW, coverage thresholds, no `.only`/skips.                                          |
| [16-observability-analytics.md](16-observability-analytics.md)           | Logging through `appLogger`, event discipline, no raw `console`.                                   |
| [17-configuration-environment.md](17-configuration-environment.md)       | `publicEnv`/`getServerEnv`, Zod-validated env, `.env.example` contract.                            |
| [18-error-handling.md](18-error-handling.md)                             | `AppError`, `toAppError`, message-key mapping, error boundaries.                                   |
| [19-release-gates.md](19-release-gates.md)                               | The `npm run validate` gate stack and what blocks a merge/release.                                 |
| [20-review-checklist.md](20-review-checklist.md)                         | The reviewer's pass — every rule above condensed into checkboxes.                                  |

Related frontend corpora: [context/frontend/](../../context/frontend/) (architecture map, stack,
navigation, reference patterns), [memory/frontend/](../../memory/frontend/) (durable decisions +
learned pitfalls), [testing/frontend/](../../testing/frontend/) (testing standards),
[docs/eslint/](../../docs/eslint/) (per-rule ESLint reference), [skills/](../../skills/)
(how-to recipes), and [docs/exceptions/](../../docs/exceptions/) (the only legal way around any rule
here).
