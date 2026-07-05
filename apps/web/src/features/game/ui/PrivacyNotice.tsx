import type { ReactNode } from 'react';

import { t } from '@/i18n';

export const PrivacyNotice = (): ReactNode => (
  <p className="rounded-xl bg-surface-muted px-4 py-3 text-sm text-text-muted">
    {t('landing.privacyNotice')}
  </p>
);
