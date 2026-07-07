# 02 — Components and Containers

The view layer is split in two: **components** (`*.component.tsx`) render, **containers**
(`*.container.tsx`) wire. Nothing else renders module UI.

## Components: JSX-only doctrine

A component file receives fully-computed props and returns markup. That is the whole job.

**Allowed in a `*.component.tsx`:**

- JSX using props, design-system primitives from `@/packages/ui-primitives`, and shared components
  from `apps/web/src/shared/components/`.
- Conditional rendering on pre-computed booleans/strings (`viewModel.resultLabel ? … : null`).
- Class bundles imported from a `*.variants.ts` / `*-style.constants.ts` file.
- `data-testid` values passed in via props or `TEST_IDS`.

**Forbidden in a `*.component.tsx`:**

- Hooks of any kind (`no-hooks-in-components`).
- Logic: computation, formatting, sorting, branching beyond render ternaries
  (`no-inline-component-logic`).
- Inline object/array/function declarations (`no-inline-declarations`).
- Raw user-facing copy — labels arrive pre-translated (`no-raw-i18n-text`).
- Raw `className` strings (`no-inline-classname-outside-design-system`); class bundles come from
  variants files or primitives.
- Imports from hooks/queries/services/store layers — enforced by the layer policy in
  [eslint/architecture.config.mjs](../../eslint/architecture.config.mjs).

Reference pattern: `apps/web/src/modules/articles/components/article-card.component.tsx` — every
label pre-translated, every class from
`apps/web/src/modules/articles/constants/article-style.constants.ts`.

## Containers: the wiring layer

A container is a `'use client'` file with a `// client-boundary-reason: …` comment. It calls exactly
one orchestration hook, switches on the view-model state, and renders components. **The container —
not the component — does the `.map()` to child elements**, so list components stay pure layout:

```tsx
case 'ready': {
  return (
    <ArticleList testId={TEST_IDS.articlesList}>
      {viewModel.items.map((item) => (
        <ArticleCard key={item.id} viewModel={item} />
      ))}
    </ArticleList>
  );
}
```

(From `apps/web/src/modules/articles/containers/articles-list.container.tsx`.)

Containers MUST:

- Handle every view-model state — loading, error, empty, ready — using the shared feedback
  components (`LoadingState`, `ErrorState`, `EmptyState` in `apps/web/src/shared/components/feedback/`).
- Close the switch with `assertNever` (`apps/web/src/shared/utils/assert-never.util.ts`) so a new
  state is a compile error, not a blank screen.
- Never import services or gateways directly (layer policy: containers consume hooks/queries only).
- Never compute or translate anything — that already happened in the hook.

## Size limits: split before a god-component forms

Both file kinds stay small and single-responsibility — carve out sub-components or sub-containers
before a god-file forms. This is mechanically enforced on `*.component.tsx` and `*.container.tsx` by
[eslint/frontend/component-size.config.mjs](../../eslint/frontend/component-size.config.mjs), tighter
than the repo-wide 300/80 base:

- `max-lines` (130) — per file.
- `max-lines-per-function` (60) — per component/render function.
- `react/jsx-max-depth` — caps JSX nesting.

Outgrowing a limit is the signal to extract. The split also decides the layer: since a
`*.component.tsx` may neither hold body-level variables nor `.map()` a list (`no-inline-component-logic`,
`no-hooks-in-components`), any view that must map a list or stage local vars is a **container** —
e.g. `game-result.container`, `game-processing.container` — the layer permitted to map.

## The view-model contract

Hooks return a discriminated-union view model (`state: 'loading' | 'error' | 'empty' | 'ready'`)
whose fields are render-ready: translated strings, formatted dates, resolved class names, stable
callbacks, test ids. See `ArticlesListViewModel` in
`apps/web/src/modules/articles/types/article.types.ts`. If a component needs to "figure something
out", the view model is incomplete — fix the hook or helper, never the component.

How-to recipes: [skills/create-component.md](../../skills/create-component.md),
[skills/create-container.md](../../skills/create-container.md). Related rules:
[03-hooks.md](03-hooks.md), [14-i18n-rtl.md](14-i18n-rtl.md).
