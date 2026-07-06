# frontend-architecture/no-inline-component-logic

- **Source:** `apps/web/eslint/architecture-plugin/rules/no-inline-component-logic.mjs`
- **Registered in:** `apps/web/eslint/architecture.config.mjs` (severity `error`)
- **Options:** none (`schema: []`)

## What it enforces

`*.component.tsx` files render already-computed props and nothing else. The rule reports:

| Pattern                                                                                   | Message                                                                                                                |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Nested function declarations                                                              | `Components must not define functions. Pass handlers down from the container as props.`                                |
| Inline functions in JSX props                                                             | `JSX props must not receive inline functions. Pass a prepared handler prop from the container.`                        |
| `.map()` / `.filter()` / `.reduce()` / `.sort()` / `.flatMap()` / `.forEach()` inside JSX | `Do not call '.map()' inside JSX. Transform data in a hook/helper/mapper and pass the result as a prop.`               |
| Nested ternaries                                                                          | `Nested ternaries are forbidden in components. Compute the branch in a helper and pass a simple prop.`                 |
| `new Date()`, `Intl.*`, regex literals in JSX                                             | `Do not use new Date() inside JSX. Compute this in a helper/mapper and pass it as a prop.`                             |
| Object/array literals in JSX props                                                        | `JSX props must not receive inline object/array literals. Move the value to a constants/ file or compute it upstream.` |

## Why

Each inline handler and object literal is a new reference every render (breaking memoized
children), each inline `.map()` is untested transformation logic living in the view, and each
nested ternary is a branch nobody can unit-test without mounting the component. The failure mode
prevented is the slow rot of "presentational" components into unmeasurable mini-apps.

## Targeted files

Only `*.component.tsx` files. Containers are explicitly allowed to do the `.map()` to child
elements — that is their job.

## Violation

From `apps/web/eslint/architecture-plugin/__fixtures__/invalid/bad-result-card.component.tsx`:

```tsx
<h2 onClick={() => setOpen(!open)}>Your matches</h2>
<ul>
  {result.matches.map((match) => (
    <li key={match.id}>{match.title}</li>
  ))}
</ul>
<p>{open ? (props.title ? props.title : 'Untitled') : 'Closed'}</p>
```

That is an inline handler, an inline `.map()` transform, and a nested ternary in one block.

## Compliant fix

The real split in the game module: the container iterates, the component renders one item, and
the hook (`apps/web/src/modules/game/hooks/use-game-result.hook.ts`) builds fully-translated view
models. From `apps/web/src/modules/game/containers/game-flow.container.tsx`:

```tsx
<ResultList testId={TEST_IDS.resultList}>
  {viewModel.matches.map((match) => (
    <ResultCard key={match.id} viewModel={match} />
  ))}
</ResultList>
```

Handlers follow the same rule: the hook exposes `viewModel.onRetry`, the container passes it as
the `onRetry` prop, and the component wires it to the DOM untouched. Date/format logic belongs in
`apps/web/src/packages/date` (`formatDisplayDate`, `formatRelativeToNow`) called from a helper
such as `apps/web/src/modules/game/helpers/result-display.helper.ts`.

## When you hit it

1. Move handlers and derived values into the hook so they arrive as props
   ([skills/create-hook.md](../../skills/create-hook.md)).
2. Move list/branch transforms into helpers or mappers
   ([rules/05-types-enums-constants.md](../../rules/05-types-enums-constants.md)).
3. Move JSX-prop object/array literals into a `constants/` file.
4. General procedure: [skills/fix-eslint-typecheck.md](../../skills/fix-eslint-typecheck.md);
   see also [rules/02-frontend-components-tsx.md](../../rules/02-frontend-components-tsx.md).
