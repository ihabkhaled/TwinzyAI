import Link from 'next/link';
import type { ReactNode } from 'react';

import { t } from '@/i18n';

export const LandingHero = (): ReactNode => (
  <section className="text-center">
    <p className="mb-3 inline-block rounded-full bg-surface-muted px-4 py-1 text-sm text-text-muted">
      {t('landing.freeBadge')}
    </p>
    <h1 className="mb-3 text-4xl font-bold">{t('app.tagline')}</h1>
    <p className="mb-6 text-lg text-text-muted">{t('app.subtitle')}</p>
    <Link
      href="/game"
      className="inline-block min-h-12 rounded-xl bg-primary px-8 py-3 text-lg font-semibold text-primary-contrast hover:bg-primary-hover"
    >
      {t('landing.startButton')}
    </Link>
  </section>
);
