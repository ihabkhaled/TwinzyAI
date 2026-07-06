'use client';
// client-boundary-reason: runs hydration, DOM mirroring, and persistence side effects for theme and direction against the browser.

import { useEffect } from 'react';

import { getSafeWindow, setRootAttribute } from '@/packages/browser';
import { readStorageJson, writeStorageJson } from '@/packages/storage';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys.constants';
import { AppTheme } from '@/shared/enums/app-theme.enum';

import {
  DARK_COLOR_SCHEME_QUERY,
  resolveInitialDirection,
  resolveThemeAttribute,
  UI_PREFERENCE_DOM_ATTRIBUTES,
} from '../model/ui-preferences.constants';
import { uiPreferencesSnapshotSchema } from '../schemas/ui-preferences.schema';
import { selectDirection, selectTheme } from '../store/ui-preferences.selectors';
import { useUiPreferencesStore } from '../store/ui-preferences.store';

/**
 * Mounts the three UI-preference side effects, each gated on `hasHydrated`:
 *
 *  1. Hydrate the store once from local storage. When nothing is persisted yet
 *     the server-rendered `dir` is adopted (so a locale-driven RTL page does
 *     not flash back to LTR) and the current in-store theme is kept.
 *  2. Mirror theme + direction onto <html>, re-resolving `system` live whenever
 *     the OS `prefers-color-scheme` changes.
 *  3. Persist the snapshot to local storage whenever it changes.
 *
 * Returns nothing; it exists purely for its effects and is mounted by
 * {@link UiPreferencesEffects}.
 */
export function useUiPreferencesEffects(): void {
  const theme = useUiPreferencesStore(selectTheme);
  const direction = useUiPreferencesStore(selectDirection);
  const hasHydrated = useUiPreferencesStore((state) => state.hasHydrated);
  const hydrate = useUiPreferencesStore((state) => state.hydrate);

  useEffect(() => {
    if (hasHydrated) {
      return;
    }

    const stored = readStorageJson(
      'local',
      STORAGE_KEYS.uiPreferences,
      uiPreferencesSnapshotSchema,
    );

    if (stored === null) {
      hydrate({ theme, direction: resolveInitialDirection() });

      return;
    }

    hydrate(stored);
  }, [hasHydrated, hydrate, theme]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const applyToDom = (): void => {
      setRootAttribute(UI_PREFERENCE_DOM_ATTRIBUTES.theme, resolveThemeAttribute(theme));
      setRootAttribute(UI_PREFERENCE_DOM_ATTRIBUTES.direction, direction);
    };

    applyToDom();

    if (theme !== AppTheme.System) {
      return;
    }

    const safeWindow = getSafeWindow();

    if (safeWindow === null) {
      return;
    }

    const mediaQueryList = safeWindow.matchMedia(DARK_COLOR_SCHEME_QUERY);

    mediaQueryList.addEventListener('change', applyToDom);

    return (): void => {
      mediaQueryList.removeEventListener('change', applyToDom);
    };
  }, [direction, hasHydrated, theme]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    writeStorageJson('local', STORAGE_KEYS.uiPreferences, { theme, direction });
  }, [direction, hasHydrated, theme]);
}
