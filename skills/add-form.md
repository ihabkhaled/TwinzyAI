# Skill: Add a Frontend Form

> Intent: add a small accessible form using the current TwinzyAI stack. There is no
> `react-hook-form` package or forms wrapper; use native React controls and Zod at the owning
> boundary. Rules 02–04, 12–13, 28–30 apply.

## When to use

Use for a real user-input workflow approved in product requirements. Do not use for a single button,
display-only filter, speculative account/auth flow, or payment form (payments are forbidden).

## Steps

1. Read the feature hook/component/gateway and its tests; search for an existing form owner first.
2. Put field ids, limits, and message keys in the feature `model/`; put reusable validation in the
   feature schema owner or `@twinzy/shared` when the API shares it.
3. Keep the component pure JSX: labels, descriptions, `aria-describedby`, invalid state, and ready
   handlers arrive as props.
4. Put state, events, and cleanup in one focused hook. Prefer native input/select/checkbox behavior;
   do not add a dependency for capabilities React/browser already provide.
5. Send data through Service → Gateway. The backend remains the validation source of truth.
6. Add localized English/Arabic copy, keyboard/focus checks, RTL-safe layout, loading, error, and
   disabled states.
7. Write behavior-first unit tests and a Playwright journey when the workflow is user-visible.

## Checklist

- [ ] Existing owner reused; no inline types/constants/schema
- [ ] Native semantic controls, labels, descriptions, keyboard/focus behavior
- [ ] Zod boundary + backend validation; no unsafe casts
- [ ] i18n/RTL/a11y and mobile 320 px behavior verified
- [ ] No image persisted; object URLs revoked when uploads are involved

## Quality gates

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:coverage
npm run test:e2e:ci
npm run build
npm run security:scan
```

Related: [create-hook.md](./create-hook.md) · [create-component.md](./create-component.md) ·
[write-accessibility-tests.md](./write-accessibility-tests.md)
