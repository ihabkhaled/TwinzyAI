import type { Metadata } from 'next';
import type { ReactElement } from 'react';

import { getServerTranslations } from '@/packages/i18n';
import { PageContainer, Stack } from '@/packages/ui-primitives';
import { ContentLinkItem } from '@/shared/components/content/content-link-item.component';
import { ContentLinks } from '@/shared/components/content/content-links.component';
import { ROUTE_PATHS } from '@/shared/constants/route-paths.constants';
import { buildPageTitle } from '@/shared/helpers/page-title.helper';
import { buildCurrentLocaleAlternates } from '@/shared/helpers/server-locale-route.helper';
import { buildContentPageLinks } from '@/shared/helpers/site-nav.helper';

import { contentListClass, contentTitleClass } from '../content.variants';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslations('terms');
  const alternates = await buildCurrentLocaleAlternates(ROUTE_PATHS.terms);

  return {
    title: buildPageTitle(t('title')),
    description: t('noSeriousUse'),
    alternates,
    openGraph: { title: t('title'), description: t('noSeriousUse'), url: alternates.canonical },
  };
}

const TermsPage = async (): Promise<ReactElement> => {
  const t = await getServerTranslations();

  return (
    <PageContainer>
      <Stack gap="md">
        <h1 className={contentTitleClass}>{t('terms.title')}</h1>
        <ul className={contentListClass}>
          <li>{t('terms.entertainment')}</li>
          <li>{t('terms.noSeriousUse')}</li>
          <li>{t('terms.permission')}</li>
          <li>{t('terms.mayBeWrong')}</li>
          <li>{t('terms.noHarassment')}</li>
        </ul>
        <ContentLinks title={t('home.learnMoreTitle')}>
          {buildContentPageLinks((key) => t(key), ROUTE_PATHS.terms).map((link) => (
            <ContentLinkItem key={link.href} href={link.href} label={link.label} />
          ))}
        </ContentLinks>
      </Stack>
    </PageContainer>
  );
};

export default TermsPage;
