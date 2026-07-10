'use client';
// client-boundary-reason: switches the active locale by writing the locale cookie, syncing writing direction in the client store, and refreshing the server tree.

import { useCallback } from 'react';

import {
  DEFAULT_LOCALE,
  isSupportedLanguageCode,
  LANGUAGE_CODES,
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
  useAppLocale,
} from '@/packages/i18n';
import { useAppNavigation } from '@/packages/navigation';
import { writeCookie } from '@/packages/storage';

import type { LocaleSwitcherController } from '../types/ui-preferences.types';

/**
 * Header language-switch controller. Reports the active locale and the locale a
 * click switches to (the other supported one), and switches by writing the
 * locale cookie the server request config reads and refreshing the server tree.
 * Writing direction is derived from that locale and is never persisted separately.
 */
export const useLocaleSwitcher = (): LocaleSwitcherController => {
  const rawLocale = useAppLocale();
  const activeLocale = isSupportedLanguageCode(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const nextLocale = LANGUAGE_CODES.find((locale) => locale !== activeLocale) ?? activeLocale;
  const navigation = useAppNavigation();

  const onSwitchLocale = useCallback((): void => {
    writeCookie(LOCALE_COOKIE_NAME, nextLocale, {
      maxAgeSeconds: LOCALE_COOKIE_MAX_AGE_SECONDS,
    });
    navigation.refresh();
  }, [nextLocale, navigation]);

  return { activeLocale, nextLocale, onSwitchLocale };
};
