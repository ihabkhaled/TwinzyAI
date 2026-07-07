/**
 * The app's only owner of zustand. Client global-state stores are created
 * through this facade so the vendor stays swappable and boundary-enforced
 * (raw `zustand` imports elsewhere are a lint error). Use the curried form for
 * a typed store: `createAppStore<State>()((set) => ({ ... }))`.
 *
 * Reminder (rules/frontend/06): stores hold CLIENT global state only — server
 * data lives in the TanStack Query cache (`@/packages/query`), never here.
 */

export { create as createAppStore } from 'zustand';
