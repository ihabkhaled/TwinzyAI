import type { ReactNode } from 'react';

import { t } from '@/i18n';

const TermsPage = (): ReactNode => (
  <main id="main-content" className="mx-auto max-w-xl px-4 py-10">
    <h1 className="mb-4 text-3xl font-bold">{t('terms.title')}</h1>
    <ul className="list-disc space-y-3 ps-5 text-text-muted">
      <li>{t('terms.entertainment')}</li>
      <li>{t('terms.noSeriousUse')}</li>
      <li>{t('terms.permission')}</li>
      <li>{t('terms.mayBeWrong')}</li>
      <li>{t('terms.noHarassment')}</li>
    </ul>
  </main>
);

export default TermsPage;
