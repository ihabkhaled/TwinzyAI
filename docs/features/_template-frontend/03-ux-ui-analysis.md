# 03 — UX / UI Analysis

> Map every screen and interaction to the design system before any component is written. The living primitive showcase is the workbench route (`/workbench`, apps/web/src/app/(workbench)/workbench/page.tsx) — verify a primitive there before assuming it exists. See architecture/adrs/adr-fe-0002-component-workbench-over-storybook.md for why there is no Storybook.

## Screens and entry points

| Screen        | Route                                                                                       | New or existing | Notes                     |
| ------------- | ------------------------------------------------------------------------------------------- | --------------- | ------------------------- |
| <screen name> | <path — must appear in ROUTE_PATHS, apps/web/src/shared/constants/route-paths.constants.ts> | <new/existing>  | <navigation entry points> |

## Design references

- **Design files:** <link to Figma/spec, or "none — pattern-composed from existing primitives">
- **Closest existing pattern in-app:** <e.g. the game flow screen (apps/web/src/modules/game) or the settings screen (apps/web/src/modules/ui-preferences)>

## Primitive inventory

<For each UI element, name the primitive from apps/web/src/packages/ui-primitives (Button, Input, Label, Card, CardTitle, CardDescription, CardContent, Alert, Spinner, Skeleton, Stack, PageContainer) or the wrapper (AppLink, AppImage, VirtualizedList, showToast, *Icon from apps/web/src/packages/icons). Anything not coverable is a design-system gap.>

| UI element | Primitive / wrapper | Gap?                   |
| ---------- | ------------------- | ---------------------- |
| <element>  | <e.g. Card + Stack> | <no / yes — see below> |

### Design-system gaps

<Each gap needs a decision: extend apps/web/src/packages/ui-primitives (design-system change, own review), or compose in the module with a *.variants.ts class-bundle file per rules/02-frontend-components-tsx.md. Raw inline className outside the design system is an ESLint error ([docs/eslint/no-inline-classname-outside-design-system.md](../../eslint/no-inline-classname-outside-design-system.md)).>

- <gap → decision>

## Interaction and state design

- **Loading:** <Skeleton vs Spinner per view, matching stage 02's state table>
- **Feedback:** <toasts via showToast from apps/web/src/packages/toast; inline Alert usage; form errors via field messages>
- **Empty state:** <copy intent and any illustration/action>
- **Focus behavior:** <where focus lands after navigation, submit, dialog open/close>

## Theming and direction

- **Dark theme:** <confirm every new visual works under [data-theme='dark'] — tokens live in apps/web/src/app/styles.css; no hardcoded colors>
- **RTL:** <call out directional icons, alignment, or ordering that need logical properties or mirroring when dir='rtl' (Arabic). See rules/12-i18n.md.>

## Copy inventory

<List every user-visible string. Each becomes a message key in both catalogs (apps/web/src/packages/i18n/messages/en.json and ar.json) during stage 04 — raw text in JSX is an ESLint error ([docs/eslint/no-raw-i18n-text.md](../../eslint/no-raw-i18n-text.md)). Any result/disclaimer copy must stay within Twinzy's AI-safety wording rules (no identity/face-match claims — root CLAUDE.md).>

| String (English draft) | Intended namespace                                                              | Notes                   |
| ---------------------- | ------------------------------------------------------------------------------- | ----------------------- |
| <copy>                 | <one of I18N_NAMESPACES, apps/web/src/shared/i18n/i18n-namespaces.constants.ts>  | <plural/interpolation?> |

## Gate

- [ ] Every element mapped to a primitive or logged as a gap with a decision
- [ ] Dark theme and RTL impact reviewed
- [ ] Copy inventory complete with namespaces
- [ ] Focus behavior specified for every interaction

**Signed off by:** <name> — <YYYY-MM-DD>
