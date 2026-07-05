import type { ReactNode } from 'react';

import { t } from '@/i18n';

const PrivacyPage = (): ReactNode => (
  <main id="main-content" className="mx-auto max-w-xl px-4 py-10">
    <h1 className="mb-4 text-3xl font-bold">{t('privacy.title')}</h1>
    <p className="mb-4 text-text-muted">{t('privacy.intro')}</p>
    <ul className="list-disc space-y-3 ps-5 text-text-muted">
      <li>{t('privacy.photoNotStored')}</li>
      <li>{t('privacy.traitsOnly')}</li>
      <li>{t('privacy.noFaceRecognition')}</li>
      <li>{t('privacy.noTemplates')}</li>
      <li>{t('privacy.geminiNote')}</li>
      <li>{t('privacy.funOnly')}</li>
      <li>{t('privacy.freeNote')}</li>
    </ul>
  </main>
);

export default PrivacyPage;
