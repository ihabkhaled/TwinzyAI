'use client';
// client-boundary-reason: mounts the hydration/DOM-sync/persistence effects for theme + direction

import { useUiPreferencesEffects } from '../hooks/useUiPreferencesEffects.hook';

/**
 * Invisible mount point for the UI-preferences side effects. Rendered once near
 * the root of the app providers tree (app-shell wave); it renders nothing and
 * exists only to run {@link useUiPreferencesEffects} inside a client boundary.
 */
export function UiPreferencesEffects(): null {
  useUiPreferencesEffects();

  return null;
}
