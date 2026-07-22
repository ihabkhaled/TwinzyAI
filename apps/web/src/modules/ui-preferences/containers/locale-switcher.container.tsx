'use client';
// client-boundary-reason: reads the active locale and triggers the client-side locale switch (cookie + refresh).

import type { ReactElement } from 'react';

import { LANGUAGE_CODES, LANGUAGE_ENDONYMS, useAppTranslation } from '@/packages/i18n';
import { headerLocaleSelectClass } from '@/shared/components/layout/app-header.variants';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import { useLocaleSwitcher } from '../hooks/useLocaleSwitcher.hook';

/**
 * Header language dropdown: every supported locale by its endonym (the name a
 * native speaker scans for), switching the whole app on selection. A native
 * `<select>` keeps it keyboard-, screen-reader-, and mobile-friendly.
 */
export const LocaleSwitcher = (): ReactElement => {
  const t = useAppTranslation();
  const { activeLocale, onSelectLocale } = useLocaleSwitcher();

  return (
    <select
      value={activeLocale}
      onChange={onSelectLocale}
      aria-label={t('app.localeSwitch')}
      className={headerLocaleSelectClass}
      data-testid={TEST_IDS.localeSwitch}
    >
      {LANGUAGE_CODES.map((code) => (
        <option key={code} value={code}>
          {LANGUAGE_ENDONYMS[code]}
        </option>
      ))}
    </select>
  );
};
