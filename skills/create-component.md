# Skill: Create a Component (JSX-only)

Create a `*.component.tsx` file that renders a pre-computed view model and nothing else. Components
in this repo are the leaves of the tree: no hooks, no logic, no inline declarations, no raw copy,
no raw `className` outside the design system. All of that is enforced by the `frontend-architecture`
ESLint rules (`no-hooks-in-components`, `no-inline-component-logic`, `no-inline-declarations`,
`no-raw-i18n-text`, `no-inline-classname-outside-design-system`; the target's
`architecture/tsx-pure-composition` rule is the current backstop).

## Read first

- [rules/frontend/02-components-and-containers.md](../rules/frontend/02-components-and-containers.md)
- [rules/frontend/14-i18n-rtl.md](../rules/frontend/14-i18n-rtl.md)
- Reference: `apps/web/src/modules/game/components/match-card.component.tsx`

## Steps

1. Define the props interface in the module's `types/` file, not inline. Props MUST carry
   display-ready data only — pre-translated strings, pre-selected class names, a `testId`. See
   `MatchCardProps` / `MatchCardViewModel` in `apps/web/src/modules/game/types/game.types.ts`.
2. Create `apps/web/src/modules/<feature>/components/<name>.component.tsx`. The whole file is one
   exported function returning `ReactElement`. The flagship example:

   ```tsx
   export function MatchCard(props: MatchCardProps): ReactElement {
     return (
       <Card data-testid={props.viewModel.testId}>
         <span className={props.viewModel.vibeBadgeClassName}>{props.viewModel.vibeLabel}</span>
         <CardTitle>{props.viewModel.title}</CardTitle>
         <CardDescription>{props.viewModel.summary}</CardDescription>
         ...
       </Card>
     );
   }
   ```

3. Compose primitives from `@/packages/ui-primitives` (`Card`, `Stack`, `Button`, ...). If you need
   a class bundle beyond primitives, define it in a `constants/<feature>-style.constants.ts` file
   (see `matchCardClasses` in `apps/web/src/modules/game/constants/game-style.constants.ts`) or a
   `*.variants.ts` file — never as a literal `className` in the JSX.
4. Copy comes in pre-translated via props. The component never calls `useAppTranslation` and never
   contains an English (or Arabic) string literal. Translation happens in the hook layer
   ([skills/create-hook.md](./create-hook.md)).
5. Wire a `testId` prop (or view-model field) through to `data-testid`, sourced from
   `TEST_IDS` in `apps/web/src/shared/constants/test-ids.constants.ts`. For repeated items use
   `buildIndexedTestId` from `apps/web/src/shared/testing/test-id.helper.ts`.
6. Keep the markup RTL-safe: the app flips `dir` via the `ui-preferences` store, so
   - use Tailwind logical utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`);
     never `ml-*`/`mr-*` or `text-left`/`text-right` in variants files,
   - use flex/grid `gap` instead of directional margins between siblings,
   - never hard-code `dir` on elements — inherit it from the root.
7. If the component only lays out children built elsewhere, accept a `children: ReactNode` slot
   like `MatchList` in `apps/web/src/modules/game/components/match-list.component.tsx` — the
   `.map()` to child elements belongs in the container, never in the component.
8. Mobile-first + a11y (this is a PWA): interactive elements carry an accessible name from i18n and
   tap targets are ≥ 44px (`min-h-12`). Add a unit test in
   `apps/web/src/modules/<feature>/test/` asserting user-visible behavior only (rendered text,
   roles, test ids) per [testing/unit-testing-standard.md](../testing/unit-testing-standard.md).

## Forbidden

- Hooks, `useState`, event-handler bodies with logic, ternary chains computing labels.
- Conditional class composition in JSX — select the class in a helper and pass it in.
- Default-exporting, declaring more than the component and its imports in the file.

## Validation (gate)

```bash
npm run lint                # ESLint flat config — 0 errors, 0 warnings
npm run typecheck           # tsgo, strict
npm run test:coverage       # Vitest — 95% global, 100% pure layers
npm run build               # next build
npm run quality:dead-code   # knip — no orphaned exports
npm run quality:circular    # madge — no import cycles
npm run test:e2e            # relevant Playwright suite (+ test:a11y / test:visual when UI changed)
```

## Definition of done

- File contains only imports and one JSX-returning function; ESLint passes with zero warnings.
- All copy and class names arrive via props/constants; `data-testid` is wired.
- Renders correctly under both `dir="ltr"` and `dir="rtl"`.
- Unit test covers each visual state the props can express.
