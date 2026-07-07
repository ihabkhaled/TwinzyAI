> Superseded for apps/web by the frontend engineering track in [rules/frontend/](frontend/README.md). Retained for backend/monorepo cross-reference.

# 02 — Frontend Components (TSX)

> Related: [00-non-negotiable-rules.md](./00-non-negotiable-rules.md) (rule 48, `architecture/tsx-pure-composition`) · [03-frontend-hooks.md](./03-frontend-hooks.md) · [05-types-enums-constants.md](./05-types-enums-constants.md) · [13-accessibility.md](./13-accessibility.md)

- TSX equals pure JSX composition. No useState/useEffect/useMemo/useCallback/useRef/useReducer.
- No handlers defined in TSX; receive them as props from hooks.
- No computed values, API calls, mutations, or nested ternaries.
- One local XxxProps interface per component file is allowed (view contract — documented
  exception; all domain shapes live in model/ or shared).
- A feature container component may call its feature controller hook (useXxxController) and
  spread the returned props downward. That is the only wiring point.
- Reuse components/ui primitives; never re-style raw controls ad hoc.

## Keep components small

- Component and container files stay single-responsibility; split into sub-components or
  sub-containers before a god-component forms.
- `*.component.tsx` and `*.container.tsx` are capped by `max-lines` (130),
  `max-lines-per-function` (60), and `react/jsx-max-depth` — tighter than the repo-wide
  300/80 base (see `eslint/frontend/component-size.config.mjs`).
- A `.component.tsx` is pure JSX: it may not call hooks (`no-hooks-in-components`) or hold
  logic, `.map()`, or inline handlers (`no-inline-component-logic`). A view that must map
  lists or keep body vars is a CONTAINER (e.g. game-result.container, game-processing.container),
  which may map.
