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
