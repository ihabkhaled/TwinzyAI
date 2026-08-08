import type { Metadata } from 'next';
import type { ReactElement } from 'react';

import { getServerTranslations } from '@/packages/i18n';
import { PageContainer, Stack } from '@/packages/ui-primitives';
import { ContentLinkItem } from '@/shared/components/content/content-link-item.component';
import { ContentLinks } from '@/shared/components/content/content-links.component';
import {
  buildGuidePath,
  GUIDE_NAMESPACE_BY_SLUG,
  GUIDE_SLUGS,
} from '@/shared/constants/guides.constants';
import { ROUTE_PATHS } from '@/shared/constants/route-paths.constants';
import { buildContentPageMetadata } from '@/shared/helpers/content-page-metadata.helper';
import { buildContentPageLinks } from '@/shared/helpers/site-nav.helper';

import { contentLeadClass, contentTitleClass } from '../content.variants';

import { GuideCard } from './guide-card.component';
import { guidesGridClass } from './guides.variants';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslations();

  return buildContentPageMetadata({
    path: ROUTE_PATHS.guides,
    title: t('guides.indexMetaTitle'),
    description: t('guides.indexMetaDescription'),
  });
}

/**
 * The Guides index: every long-form educational article, each useful on its
 * own without requiring the game, and each linking back to it.
 */
const GuidesPage = async (): Promise<ReactElement> => {
  const t = await getServerTranslations();

  return (
    <PageContainer>
      <Stack gap="md">
        <h1 className={contentTitleClass}>{t('guides.indexTitle')}</h1>
        <p className={contentLeadClass}>{t('guides.indexIntro')}</p>
        <div className={guidesGridClass}>
          {GUIDE_SLUGS.map((slug) => {
            const namespace = GUIDE_NAMESPACE_BY_SLUG[slug];
            return (
              <GuideCard
                key={slug}
                href={buildGuidePath(slug)}
                title={t(`guides.${namespace}.navTitle`)}
                teaser={t(`guides.${namespace}.navTeaser`)}
              />
            );
          })}
        </div>
        <ContentLinks title={t('home.learnMoreTitle')}>
          {buildContentPageLinks((key) => t(key), ROUTE_PATHS.guides).map((link) => (
            <ContentLinkItem key={link.href} href={link.href} label={link.label} />
          ))}
        </ContentLinks>
      </Stack>
    </PageContainer>
  );
};

export default GuidesPage;
