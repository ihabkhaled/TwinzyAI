import type { Metadata } from 'next';
import type { ReactElement } from 'react';

import { getServerTranslations } from '@/packages/i18n';
import { PageContainer, Stack } from '@/packages/ui-primitives';
import { ContentLinkItem } from '@/shared/components/content/content-link-item.component';
import { ContentLinks } from '@/shared/components/content/content-links.component';
import { HOW_IT_WORKS_SECTION_KEYS } from '@/shared/constants/content-pages.constants';
import { ROUTE_PATHS } from '@/shared/constants/route-paths.constants';
import { buildPageTitle } from '@/shared/helpers/page-title.helper';
import { buildContentPageLinks } from '@/shared/helpers/site-nav.helper';

import {
  contentBodyClass,
  contentLeadClass,
  contentSectionClass,
  contentSectionTitleClass,
  contentTitleClass,
} from '../content.variants';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslations('howItWorks');

  return {
    title: buildPageTitle(t('metaTitle')),
    description: t('metaDescription'),
    alternates: { canonical: ROUTE_PATHS.howItWorks },
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      url: ROUTE_PATHS.howItWorks,
    },
  };
}

/** Every step of a round, in order, including what happens to the photo. */
const HowItWorksPage = async (): Promise<ReactElement> => {
  const t = await getServerTranslations();

  return (
    <PageContainer>
      <Stack gap="md">
        <h1 className={contentTitleClass}>{t('howItWorks.title')}</h1>
        <p className={contentLeadClass}>{t('howItWorks.intro')}</p>
        {HOW_IT_WORKS_SECTION_KEYS.map((key) => (
          <section key={key} className={contentSectionClass}>
            <h2 className={contentSectionTitleClass}>{t(`howItWorks.${key}Title`)}</h2>
            <p className={contentBodyClass}>{t(`howItWorks.${key}Body1`)}</p>
            <p className={contentBodyClass}>{t(`howItWorks.${key}Body2`)}</p>
          </section>
        ))}
        <ContentLinks title={t('home.learnMoreTitle')}>
          {buildContentPageLinks((key) => t(key), ROUTE_PATHS.howItWorks).map((link) => (
            <ContentLinkItem key={link.href} href={link.href} label={link.label} />
          ))}
        </ContentLinks>
      </Stack>
    </PageContainer>
  );
};

export default HowItWorksPage;
