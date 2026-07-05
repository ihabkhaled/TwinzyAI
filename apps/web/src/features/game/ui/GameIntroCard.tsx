import type { ReactNode } from 'react';

import { Card } from '@/components/ui';
import { t } from '@/i18n';

export const GameIntroCard = (): ReactNode => (
  <Card>
    <h2 className="mb-3 text-xl font-semibold">{t('landing.howItWorksTitle')}</h2>
    <ol className="list-decimal space-y-2 ps-5 text-text-muted">
      <li>{t('landing.step1')}</li>
      <li>{t('landing.step2')}</li>
      <li>{t('landing.step3')}</li>
    </ol>
  </Card>
);
