import type { Metadata } from 'next';
import type { ReactElement } from 'react';

import { getServerTranslations } from '@/packages/i18n';
import { PageContainer, Stack } from '@/packages/ui-primitives';
import { ROUTE_PATHS } from '@/shared/constants/route-paths.constants';
import { buildPageTitle } from '@/shared/helpers/page-title.helper';

import {
  contentDefinitionListClass,
  contentDescriptionClass,
  contentTermClass,
  contentTitleClass,
} from '../content.variants';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslations('help');

  return {
    title: buildPageTitle(t('title')),
    alternates: { canonical: ROUTE_PATHS.help },
    openGraph: { title: t('title'), url: ROUTE_PATHS.help },
  };
}

const HelpPage = async (): Promise<ReactElement> => {
  const t = await getServerTranslations('help');

  return (
    <PageContainer>
      <Stack gap="md">
        <h1 className={contentTitleClass}>{t('title')}</h1>
        <dl className={contentDefinitionListClass}>
          <div>
            <dt className={contentTermClass}>{t('q1')}</dt>
            <dd className={contentDescriptionClass}>{t('a1')}</dd>
          </div>
          <div>
            <dt className={contentTermClass}>{t('q2')}</dt>
            <dd className={contentDescriptionClass}>{t('a2')}</dd>
          </div>
          <div>
            <dt className={contentTermClass}>{t('q3')}</dt>
            <dd className={contentDescriptionClass}>{t('a3')}</dd>
          </div>
          <div>
            <dt className={contentTermClass}>{t('q4')}</dt>
            <dd className={contentDescriptionClass}>{t('a4')}</dd>
          </div>
          <div>
            <dt className={contentTermClass}>{t('q5')}</dt>
            <dd className={contentDescriptionClass}>{t('a5')}</dd>
          </div>
        </dl>
      </Stack>
    </PageContainer>
  );
};

export default HelpPage;
