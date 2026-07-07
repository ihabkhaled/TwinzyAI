'use client';
// client-boundary-reason: reads the client theme store and renders the interactive light/dark toggle.

import type { ReactElement } from 'react';

import { useAppTranslation } from '@/packages/i18n';
import { MoonIcon, SunIcon } from '@/packages/icons';
import { Button } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import { useThemeToggle } from '../hooks/useThemeToggle.hook';

/** Header control that flips between the light and dark themes. */
export const ThemeToggle = (): ReactElement => {
  const t = useAppTranslation();
  const { isDark, hasHydrated, onToggleTheme } = useThemeToggle();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggleTheme}
      aria-label={t('app.themeToggle')}
      testId={TEST_IDS.themeToggle}
    >
      {hasHydrated && isDark ? (
        <SunIcon aria-hidden size={18} />
      ) : (
        <MoonIcon aria-hidden size={18} />
      )}
    </Button>
  );
};
