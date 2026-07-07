import type { Metadata } from 'next';
import type { ReactElement } from 'react';

import { getServerTranslations } from '@/packages/i18n';
import { PageContainer, Stack } from '@/packages/ui-primitives';
import { buildPageTitle } from '@/shared/helpers/page-title.helper';

import { contentListClass, contentTitleClass } from '../content.variants';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslations('terms');

  return { title: buildPageTitle(t('title')) };
}

const TermsPage = async (): Promise<ReactElement> => {
  const t = await getServerTranslations('terms');

  return (
    <PageContainer>
      <Stack gap="md">
        <h1 className={contentTitleClass}>{t('title')}</h1>
        <ul className={contentListClass}>
          <li>{t('entertainment')}</li>
          <li>{t('noSeriousUse')}</li>
          <li>{t('permission')}</li>
          <li>{t('mayBeWrong')}</li>
          <li>{t('noHarassment')}</li>
        </ul>
      </Stack>
    </PageContainer>
  );
};

export default TermsPage;
