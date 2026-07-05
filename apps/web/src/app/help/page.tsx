import type { ReactNode } from 'react';

import { t } from '@/i18n';

const HelpPage = (): ReactNode => (
  <main id="main-content" className="mx-auto max-w-xl px-4 py-10">
    <h1 className="mb-4 text-3xl font-bold">{t('help.title')}</h1>
    <dl className="space-y-5">
      <div>
        <dt className="font-semibold">{t('help.q1')}</dt>
        <dd className="mt-1 text-text-muted">{t('help.a1')}</dd>
      </div>
      <div>
        <dt className="font-semibold">{t('help.q2')}</dt>
        <dd className="mt-1 text-text-muted">{t('help.a2')}</dd>
      </div>
      <div>
        <dt className="font-semibold">{t('help.q3')}</dt>
        <dd className="mt-1 text-text-muted">{t('help.a3')}</dd>
      </div>
      <div>
        <dt className="font-semibold">{t('help.q4')}</dt>
        <dd className="mt-1 text-text-muted">{t('help.a4')}</dd>
      </div>
      <div>
        <dt className="font-semibold">{t('help.q5')}</dt>
        <dd className="mt-1 text-text-muted">{t('help.a5')}</dd>
      </div>
    </dl>
  </main>
);

export default HelpPage;
