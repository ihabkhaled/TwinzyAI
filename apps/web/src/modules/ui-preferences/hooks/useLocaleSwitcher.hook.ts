'use client';
// client-boundary-reason: switches the active locale by writing the locale cookie, syncing writing direction in the client store, and refreshing the server tree.

import type { ChangeEvent } from 'react';
import { useCallback } from 'react';

import {
  DEFAULT_LOCALE,
  isSupportedLanguageCode,
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
  useAppLocale,
} from '@/packages/i18n';
import { useAppNavigation } from '@/packages/navigation';
import { writeCookie } from '@/packages/storage';

import type { LocaleSwitcherController } from '../types/ui-preferences.types';

/**
 * Header language-dropdown controller. Reports the active locale and switches
 * to whichever supported locale the user picks by writing the locale cookie the
 * server request config reads and refreshing the server tree. Writing direction
 * is derived from that locale and is never persisted separately. An unknown or
 * unchanged selection is a no-op.
 */
export const useLocaleSwitcher = (): LocaleSwitcherController => {
  const rawLocale = useAppLocale();
  const activeLocale = isSupportedLanguageCode(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const navigation = useAppNavigation();

  const onSelectLocale = useCallback(
    (event: ChangeEvent<HTMLSelectElement>): void => {
      const selected = event.target.value;
      if (!isSupportedLanguageCode(selected) || selected === activeLocale) {
        return;
      }
      writeCookie(LOCALE_COOKIE_NAME, selected, {
        maxAgeSeconds: LOCALE_COOKIE_MAX_AGE_SECONDS,
      });
      navigation.refresh();
    },
    [activeLocale, navigation],
  );

  return { activeLocale, onSelectLocale };
};
