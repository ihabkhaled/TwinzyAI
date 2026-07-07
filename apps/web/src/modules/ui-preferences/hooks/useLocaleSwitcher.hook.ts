'use client';
// client-boundary-reason: switches the active locale by writing the locale cookie, syncing writing direction in the client store, and refreshing the server tree.

import { useCallback } from 'react';

import {
  DEFAULT_LOCALE,
  getLocaleDirection,
  isSupportedLocale,
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
  SUPPORTED_LOCALES,
  useAppLocale,
} from '@/packages/i18n';
import { useAppNavigation } from '@/packages/navigation';
import { writeCookie } from '@/packages/storage';

import { useUiPreferencesStore } from '../store/ui-preferences.store';
import type { LocaleSwitcherController } from '../types/ui-preferences.types';

/**
 * Header language-switch controller. Reports the active locale and the locale a
 * click switches to (the other supported one), and switches by writing the
 * locale cookie the server request config reads, updating the persisted writing
 * direction so it does not fight the new locale, and refreshing the server tree
 * so all copy re-renders in the new language.
 */
export const useLocaleSwitcher = (): LocaleSwitcherController => {
  const rawLocale = useAppLocale();
  const activeLocale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const nextLocale = SUPPORTED_LOCALES.find((locale) => locale !== activeLocale) ?? activeLocale;
  const setDirection = useUiPreferencesStore((state) => state.setDirection);
  const navigation = useAppNavigation();

  const onSwitchLocale = useCallback((): void => {
    writeCookie(LOCALE_COOKIE_NAME, nextLocale, {
      maxAgeSeconds: LOCALE_COOKIE_MAX_AGE_SECONDS,
    });
    setDirection(getLocaleDirection(nextLocale));
    navigation.refresh();
  }, [nextLocale, setDirection, navigation]);

  return { activeLocale, nextLocale, onSwitchLocale };
};
