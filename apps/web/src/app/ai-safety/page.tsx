import type { Metadata } from 'next';
import type { ReactElement } from 'react';

import { getServerTranslations } from '@/packages/i18n';
import { PageContainer, Stack } from '@/packages/ui-primitives';
import { ContentLinkItem } from '@/shared/components/content/content-link-item.component';
import { ContentLinks } from '@/shared/components/content/content-links.component';
import { AI_SAFETY_SECTION_KEYS } from '@/shared/constants/content-pages.constants';
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
  const t = await getServerTranslations('aiSafety');

  return {
    title: buildPageTitle(t('metaTitle')),
    description: t('metaDescription'),
    alternates: { canonical: ROUTE_PATHS.aiSafety },
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      url: ROUTE_PATHS.aiSafety,
    },
  };
}

/** The safety rules enforced in code on every round, and their honest limits. */
const AiSafetyPage = async (): Promise<ReactElement> => {
  const t = await getServerTranslations();

  return (
    <PageContainer>
      <Stack gap="md">
        <h1 className={contentTitleClass}>{t('aiSafety.title')}</h1>
        <p className={contentLeadClass}>{t('aiSafety.intro')}</p>
        {AI_SAFETY_SECTION_KEYS.map((key) => (
          <section key={key} className={contentSectionClass}>
            <h2 className={contentSectionTitleClass}>{t(`aiSafety.${key}Title`)}</h2>
            <p className={contentBodyClass}>{t(`aiSafety.${key}Body1`)}</p>
            <p className={contentBodyClass}>{t(`aiSafety.${key}Body2`)}</p>
          </section>
        ))}
        <ContentLinks title={t('home.learnMoreTitle')}>
          {buildContentPageLinks((key) => t(key), ROUTE_PATHS.aiSafety).map((link) => (
            <ContentLinkItem key={link.href} href={link.href} label={link.label} />
          ))}
        </ContentLinks>
      </Stack>
    </PageContainer>
  );
};

export default AiSafetyPage;
