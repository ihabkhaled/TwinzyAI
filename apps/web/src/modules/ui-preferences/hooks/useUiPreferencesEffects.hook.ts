'use client';
// client-boundary-reason: runs hydration, DOM mirroring, and persistence side effects for theme and direction against the browser.

import { useEffect } from 'react';

import { getSafeWindow, setRootAttribute } from '@/packages/browser';
import {
  DEFAULT_LOCALE,
  getLocaleDirection,
  isSupportedLanguageCode,
  useAppLocale,
} from '@/packages/i18n';
import { readStorageJson, writeCookie, writeStorageJson } from '@/packages/storage';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys.constants';
import {
  THEME_COOKIE_MAX_AGE_SECONDS,
  THEME_COOKIE_NAME,
} from '@/shared/constants/theme-cookie.constants';
import { AppTheme } from '@/shared/enums/app-theme.enum';

import {
  DARK_COLOR_SCHEME_QUERY,
  resolveInitialTheme,
  resolveThemeAttribute,
  UI_PREFERENCE_DOM_ATTRIBUTES,
} from '../model/ui-preferences.constants';
import { uiPreferencesSnapshotSchema } from '../schemas/ui-preferences.schema';
import { selectTheme } from '../store/ui-preferences.selectors';
import { useUiPreferencesStore } from '../store/ui-preferences.store';

/**
 * Mounts the three UI-preference side effects, each gated on `hasHydrated`:
 *
 *  1. Hydrate the theme once from local storage.
 *  2. Mirror theme + locale-derived direction onto <html>, re-resolving `system` live whenever
 *     the OS `prefers-color-scheme` changes.
 *  3. Persist the snapshot to local storage whenever it changes.
 *
 * Returns nothing; it exists purely for its effects and is mounted by
 * {@link UiPreferencesEffects}.
 */
export function useUiPreferencesEffects(): void {
  const theme = useUiPreferencesStore(selectTheme);
  const rawLocale = useAppLocale();
  const activeLocale = isSupportedLanguageCode(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const direction = getLocaleDirection(activeLocale);
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
      hydrate({ theme: resolveInitialTheme(theme) });

      return;
    }

    hydrate(stored);
  }, [hasHydrated, hydrate, theme]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const applyToDom = (): void => {
      const resolvedScheme = resolveThemeAttribute(theme);
      setRootAttribute(UI_PREFERENCE_DOM_ATTRIBUTES.theme, resolvedScheme);
      setRootAttribute(UI_PREFERENCE_DOM_ATTRIBUTES.direction, direction);
      // Mirror the resolved scheme into a cookie so the next server render sets
      // data-theme correctly on the first paint (no flash / hydration mismatch).
      writeCookie(THEME_COOKIE_NAME, resolvedScheme, {
        maxAgeSeconds: THEME_COOKIE_MAX_AGE_SECONDS,
      });
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

    writeStorageJson('local', STORAGE_KEYS.uiPreferences, { theme });
  }, [hasHydrated, theme]);
}
