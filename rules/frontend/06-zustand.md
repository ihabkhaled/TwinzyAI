# 06 — Zustand

Zustand holds **client-owned global state** and nothing else. Stores are created only through
`createAppStore` from the wrapper `apps/web/src/packages/zustand` (raw `zustand` imports violate
`no-raw-package-imports`), and live in `apps/web/src/modules/<feature>/store/`.

## Allowed vs forbidden state

**Allowed** (state the client owns and the server does not):

- UI preferences: theme, direction, sidebar — reference store
  `apps/web/src/modules/ui-preferences/store/ui-preferences.store.ts`.
- Ephemeral play state the server does not own yet: the current game round's local step
  (upload → matching → reveal), the consent checkbox, a not-yet-submitted draft.
- Multi-step wizard/draft state that has not been submitted yet.

**Forbidden — any server data.** Match results, candidate lists, or anything a query returns MUST
stay in the TanStack Query cache ([05-tanstack-query.md](05-tanstack-query.md)). Mirroring server data
into a store creates a second source of truth that never invalidates. Tokens, secrets, and — per the
Twinzy product non-negotiables in [CLAUDE.md](../../CLAUDE.md) — any uploaded image bytes are also
forbidden as store fields; images live only in memory during the request and are never held in client
state. Enforced by the `module-store` layer policy in
[eslint/architecture.config.mjs](../../eslint/architecture.config.mjs) (stores cannot import services,
gateways, or query files) and review.

## Store purity

Store files define state and pure transitions only:

- Actions compute the next state from the previous state and their arguments. Nothing else.
- **No side effects in stores**: no `localStorage`, no DOM writes, no HTTP, no timers. Persistence and
  DOM synchronization live in dedicated effects hooks — the reference is
  `apps/web/src/modules/ui-preferences/hooks/use-ui-preferences-effects.hook.ts`, which hydrates from
  `readStorageJson` (schema-validated, `@/packages/storage`), persists with `writeStorageJson` under
  `STORAGE_KEYS`, and syncs `data-theme`/`dir` via `setRootAttribute` (`@/packages/browser`). The
  effects hook is mounted once by
  `apps/web/src/modules/ui-preferences/containers/ui-preferences-effects.container.tsx` inside the app
  providers.
- Hydration MUST validate persisted payloads against a Zod schema
  (`apps/web/src/modules/ui-preferences/schemas/ui-preferences.schema.ts`) and fall back to defaults on
  mismatch — never trust old localStorage shapes.

## Selectors in a separate file

Consumers never subscribe to a whole store. Named selectors live in `store/*.selectors.ts` (reference:
`apps/web/src/modules/ui-preferences/store/ui-preferences.selectors.ts`) and are consumed via the store
hook or `useAppStoreShallow` for multi-field reads. This keeps re-renders scoped to the fields that
changed and gives every subscription a testable name.

## Checklist for a new store

1. Does the server already own this data? If yes — stop, use a query.
2. Define types in `types/`, defaults in `constants/`, schema in `schemas/`.
3. Create the store with `createAppStore`; pure actions only.
4. Add `*.selectors.ts`; consumers import selectors, not state shape.
5. If persisted or DOM-synced: add an effects hook using the storage/browser facades.
6. Unit-test transitions and hydration fallbacks in `apps/web/src/modules/<feature>/test/`.

How-to: [skills/create-zustand-store.md](../../skills/create-zustand-store.md).
