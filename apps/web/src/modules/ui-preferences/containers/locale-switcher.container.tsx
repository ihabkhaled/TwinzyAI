'use client';
// client-boundary-reason: reads the active locale and triggers the client-side locale switch (cookie + refresh).

import type { ReactElement } from 'react';

import { useAppTranslation } from '@/packages/i18n';
import { GlobeIcon } from '@/packages/icons';
import { Button } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import { useLocaleSwitcher } from '../hooks/useLocaleSwitcher.hook';
import { LOCALE_LABEL_KEYS } from '../model/ui-preferences.constants';

/** Header control that toggles between the supported locales. */
export const LocaleSwitcher = (): ReactElement => {
  const t = useAppTranslation();
  const { nextLocale, onSwitchLocale } = useLocaleSwitcher();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onSwitchLocale}
      aria-label={t('app.localeSwitch')}
      testId={TEST_IDS.localeSwitch}
    >
      <GlobeIcon aria-hidden size={18} />
      {t(LOCALE_LABEL_KEYS[nextLocale])}
    </Button>
  );
};
