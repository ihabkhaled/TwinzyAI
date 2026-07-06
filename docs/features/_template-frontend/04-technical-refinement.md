# 04 — Technical Refinement

> Translate requirements into the repo's exact vocabulary: module, layers, wrappers, keys, routes. Everything named here must follow the naming and layer rules in rules/01-architecture.md. Use [skills/create-module.md](../../../skills/create-module.md) when scaffolding.

## Module plan

- **Module name:** `apps/web/src/modules/<feature-slug>` <or: "extends existing module <name>">
- **Public surface:** <what `apps/web/src/modules/<slug>/index.ts` will export — cross-module consumers import only from `@/modules/<slug>`>
- **Reference module:** apps/web/src/modules/game is the flagship anatomy; diff your plan against it.

## Layer plan

<Mark each layer used/unused. An unused layer is simply omitted from the module — do not create empty directories.>

| Layer                                                             | Used? | Planned files                                                                                    |
| ----------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------ |
| `api/` (wire types + mock fixtures)                               | <y/n> | <e.g. <slug>.api.types.ts, <slug>.mock.ts>                                                       |
| `gateway/` (BFF endpoint calls via buildGatewayPath)              | <y/n> | <files>                                                                                          |
| `services/` (React-free orchestration)                            | <y/n> | <files>                                                                                          |
| `queries/` (query keys builder, queries, mutations, invalidation) | <y/n> | <files — keys builder is mandatory if any query exists, see [docs/eslint/no-inline-query-keys.md](../../eslint/no-inline-query-keys.md)> |
| `store/` (Zustand via createAppStore)                             | <y/n> | <files>                                                                                          |
| `mappers/` (snake_case wire → camelCase domain)                   | <y/n> | <files>                                                                                          |
| `schemas/` (Zod via apps/web/src/packages/zod)                    | <y/n> | <files>                                                                                          |
| `hooks/` → `containers/` → `components/`                          | <y/n> | <files>                                                                                          |
| `types/ enums/ constants/ utils/ helpers/`                        | <y/n> | <files — enums are `as const` objects + derived types, never the TS `enum` keyword (root CLAUDE.md)> |
| `test/` (module unit tests)                                       | yes   | <mirrors the files above>                                                                        |

## Routes

| New route | Path constant to add to ROUTE_PATHS                                 | App Router file                                                                  |
| --------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| <name>    | <'/path' in apps/web/src/shared/constants/route-paths.constants.ts> | <apps/web/src/app/.../page.tsx — routes/layouts only, logic lives in the module> |

## API / BFF plan

- **Upstream endpoints:** <method + path per endpoint; clients call them same-origin through the gateway: `httpClient` + `buildGatewayPath('<upstream-path>')` from apps/web/src/shared/api/api-routes.constants.ts. The upstream is the NestJS API in apps/api (e.g. POST /api/v1/game/analyze). Uploaded images travel only in the gateway request and are never stored client-side — Twinzy no-persistence rule.>
- **Mock fixtures:** <what `<slug>.mock.ts` returns so the feature runs under SERVER_API_MOCKING=enabled with zero backend — pattern: apps/web/src/modules/game/api/game.mock.ts>
- **Wire → domain mapping:** <fields renamed/derived in the mapper>

## Package wrappers

- **Existing wrappers consumed:** <list from apps/web/src/packages/* — e.g. http, query, zod, forms, toast, icons, virtuoso>
- **New third-party packages:** <none, or: vendor → new wrapper `apps/web/src/packages/<vendor>` via [skills/add-library.md](../../../skills/add-library.md) + entry in apps/web/eslint/package-boundaries.config.mjs + decision record in memory/library-boundaries.md. Raw vendor imports outside the wrapper are an ESLint error.>

## i18n message keys

- **Namespace:** <existing entry in I18N_NAMESPACES or a new one added to apps/web/src/shared/i18n/i18n-namespaces.constants.ts>
- **Keys:** <key list from stage 03's copy inventory; each lands in both apps/web/src/packages/i18n/messages/en.json and ar.json via [skills/add-i18n-message-key.md](../../../skills/add-i18n-message-key.md)>
- **Error keys:** <new entries in ERROR_MESSAGE_KEYS (apps/web/src/shared/errors/error-keys.constants.ts) if the feature has distinct failure modes>

## Environment and configuration

<New env vars? Public ones are NEXT_PUBLIC_* via publicEnv; server-only ones go through getServerEnv ('@/packages/env/server'). Every addition updates .env.example and the Zod schema in apps/web/src/packages/env. "None" is the common answer.>

## Technical risks

| Risk                        | Mitigation                                                |
| --------------------------- | --------------------------------------------------------- |
| <e.g. large list rendering> | <e.g. VirtualizedList from apps/web/src/packages/virtuoso> |

## Gate

- [ ] Layer plan complete; every planned file named
- [ ] Query-keys builder planned if any TanStack Query usage exists
- [ ] All copy mapped to message keys in a named namespace
- [ ] New vendors (if any) have a wrapper plan and ownership entry
- [ ] Mock fixture plan lets the feature run with zero backend

**Signed off by:** <name> — <YYYY-MM-DD>
