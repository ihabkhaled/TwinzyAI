# 05 — Architecture Review

> An architect (human or a frontend architect reviewer — see [agents/README.md](../../../agents/README.md)) reviews the stage-04 plan against the architecture rules before implementation starts. The canonical references are [rules/01-architecture.md](../../../rules/01-architecture.md), the boundary map in [memory/library-boundaries.md](../../../memory/library-boundaries.md), and the layer policy table in apps/web/eslint/architecture.config.mjs.

## Review inputs

- **Stage-04 document version reviewed:** <commit hash or date>
- **Reviewer:** <name / agent>

## Boundary checklist

- [ ] **App layer stays thin.** New files under apps/web/src/app/ are routes, layouts, or route handlers only; all logic lands in the module. <Confirm or list violations.>
- [ ] **Module public surface.** Cross-module consumers import only `@/modules/<slug>`; no deep imports planned ([docs/eslint/no-cross-module-deep-imports.md](../../eslint/no-cross-module-deep-imports.md)). <Confirm.>
- [ ] **Layer import direction.** The plan respects the policy table in apps/web/eslint/architecture.config.mjs — components depend on nothing stateful, containers wire hooks to components, services/gateways are React-free (rules/04-frontend-services-gateways.md). <Confirm.>
- [ ] **Vendor ownership.** Every third-party dependency flows through its wrapper in apps/web/src/packages/ per apps/web/eslint/package-boundaries.config.mjs; no raw vendor imports planned ([docs/eslint/no-raw-package-imports.md](../../eslint/no-raw-package-imports.md)). <Confirm; list new wrappers.>
- [ ] **shared vs module placement.** Anything planned for apps/web/src/shared/ is genuinely generic (used or plausibly usable by ≥2 modules); anything feature-specific stays in the module (rules/05-types-enums-constants.md). <Confirm.>
- [ ] **Server/client split.** Client components carry `'use client'` + a `// client-boundary-reason:` comment ([docs/eslint/require-client-component-reason.md](../../eslint/require-client-component-reason.md)); nothing importing server-only code crosses into the client bundle ([docs/eslint/no-server-only-import-in-client.md](../../eslint/no-server-only-import-in-client.md)). <Confirm the planned boundary components.>
- [ ] **BFF discipline.** All network calls go same-origin through `/api/gateway/[...path]` using buildGatewayPath — no direct external hosts from the browser. <Confirm.>
- [ ] **State placement.** Server state lives in TanStack Query (rules/04-frontend-services-gateways.md); only genuine client state gets a Zustand store (rules/03-frontend-hooks.md). <Confirm which is which for this feature.>
- [ ] **Twinzy constraints.** No image persistence, no monetization, no identity/face-match logic or copy introduced by this plan (root CLAUDE.md "Twinzy Product Constraints"). <Confirm.>

## Deviations requested

<Any deliberate deviation from the rules needs an exception filed per docs/exceptions/exception-template.md before it ships. List requested deviations here with the exception file path, or "none".>

| Deviation   | Justification | Exception file              |
| ----------- | ------------- | --------------------------- |
| <deviation> | <why>         | <docs/exceptions/<file>.md> |

## Architecture decisions taken

<Decisions of lasting consequence (new shared abstraction, new wrapper, new pattern) get an ADR under architecture/adrs/ using architecture/adrs/adr-template.md (frontend ADRs use the adr-fe-NNNN prefix). List them, or "none".>

## Verdict

- **Outcome:** <approved | approved with conditions | rework stage 04>
- **Conditions:** <list, or "none">

## Gate

- [ ] All boundary checklist items confirmed or covered by a filed exception
- [ ] ADRs written for any lasting decisions
- [ ] Verdict recorded

**Signed off by:** <name> — <YYYY-MM-DD>
