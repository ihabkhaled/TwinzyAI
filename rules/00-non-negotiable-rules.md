# 00 — Non-Negotiable Rules

1. Full strict TypeScript (tsconfig.base.json is frozen — fix code, never flags).
2. Full strict ESLint (/eslint is never weakened to pass).
3. No `any`.
4. No `eslint-disable`.
5. No `@ts-ignore`.
6. No `@ts-expect-error` unless documented in docs/package-decisions.md.
7. No non-null assertion `!`.
8. No TypeScript `enum` keyword.
9. Enums are `as const` objects plus derived types (see packages/shared/src/enums).
10. No magic strings for domain values — shared constants.
11. No inline types. 12. No inline interfaces. 13. No inline constants. 14. No inline DTOs.
15. No inline schemas. 16. No inline request/response bodies. 17. No inline config maps.
    (Each lives in its dedicated folder: types/, interfaces/, constants/, dto/, schemas/, model/.)
18. No business logic in TSX. 19. No hooks defined inside component files.
20. Components are pure JSX composition. 21. Pages/routes are composition only.
22. Hooks are thin orchestrators. 23. Complex hook logic goes to helpers/mappers/guards in lib/.
24. Controllers are thin transport adapters (one manager call).
25. Managers orchestrate use cases. 26. Services own one focused capability.
27. Repositories only persist. 28. External libraries go through adapters/wrappers.
29. No direct SDK imports outside adapters. 30. No process.env outside config modules.
31. No raw fetch/axios outside the HTTP client/gateway wrapper.
32. No raw browser storage outside the storage wrapper.
33. All user-facing strings use i18n. 34. No duplicate i18n keys (typed dictionary enforces).
35. RTL-ready: use start/end utilities, not left/right, where possible.
36. No raw table if a DataTable wrapper exists. 37. No raw form controls if UI wrappers exist.
38. No huge functions (max 80 lines). 39. No huge files (max 300 lines). 40. No spaghetti code.
41. Tests first. 42. Never weaken rules to pass. 43. The game is free — no payment code, ever.
