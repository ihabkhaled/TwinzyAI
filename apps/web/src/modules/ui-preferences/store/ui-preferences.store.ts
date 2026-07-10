import { createAppStore } from '@/packages/zustand';
import { AppTheme } from '@/shared/enums/app-theme.enum';

import type { UiPreferencesState } from '../types/ui-preferences.types';

/**
 * Client-global UI-preferences store. Pure by construction: it holds the theme
 * preference and exposes a synchronous setter plus a `hydrate`
 * action. All side effects — hydration from storage, mirroring to <html>, and
 * persistence — live in `useUiPreferencesEffects`, keeping this store fully
 * unit-testable and safe to import from server-rendered trees.
 *
 * Theme starts as `system` (defers to the OS scheme). `hasHydrated` stays `false` until
 * the effects hook has read persisted state, which gates the DOM/persistence
 * effects so they never run against provisional defaults.
 */
export const useUiPreferencesStore = createAppStore<UiPreferencesState>()((set) => ({
  theme: AppTheme.System,
  hasHydrated: false,
  setTheme: (theme): void => {
    set({ theme });
  },
  hydrate: (snapshot): void => {
    set({ ...snapshot, hasHydrated: true });
  },
}));
