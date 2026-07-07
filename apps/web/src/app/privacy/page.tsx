import type { Metadata } from 'next';
import type { ReactElement } from 'react';

import { PrivacyNotice } from '@/modules/game';
import { getServerTranslations } from '@/packages/i18n';
import { PageContainer, Stack } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';
import { buildPageTitle } from '@/shared/helpers/page-title.helper';

import { contentLeadClass, contentListClass, contentTitleClass } from '../content.variants';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslations('privacy');

  return { title: buildPageTitle(t('title')) };
}

const PrivacyPage = async (): Promise<ReactElement> => {
  const t = await getServerTranslations('privacy');

  return (
    <PageContainer>
      <Stack gap="md">
        <h1 className={contentTitleClass}>{t('title')}</h1>
        <p className={contentLeadClass}>{t('intro')}</p>
        <PrivacyNotice message={t('photoNotStored')} testId={TEST_IDS.privacyNotice} />
        <ul className={contentListClass}>
          <li>{t('traitsOnly')}</li>
          <li>{t('noFaceRecognition')}</li>
          <li>{t('noTemplates')}</li>
          <li>{t('geminiNote')}</li>
          <li>{t('funOnly')}</li>
          <li>{t('freeNote')}</li>
        </ul>
      </Stack>
    </PageContainer>
  );
};

export default PrivacyPage;
