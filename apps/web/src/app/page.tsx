import type { Metadata } from 'next';
import type { ReactElement } from 'react';

import { LandingContainer } from '@/modules/game';
import { publicEnv } from '@/packages/env';
import { getServerTranslations } from '@/packages/i18n';
import { PageContainer, Stack } from '@/packages/ui-primitives';
import { ContentLinkItem } from '@/shared/components/content/content-link-item.component';
import { ContentLinks } from '@/shared/components/content/content-links.component';
import { JsonLdScript } from '@/shared/components/seo/json-ld.container';
import { HOME_SECTION_KEYS } from '@/shared/constants/content-pages.constants';
import { ROUTE_PATHS } from '@/shared/constants/route-paths.constants';
import { buildPageTitle } from '@/shared/helpers/page-title.helper';
import { buildContentPageLinks } from '@/shared/helpers/site-nav.helper';
import {
  buildWebApplicationJsonLd,
  serializeJsonLd,
} from '@/shared/helpers/structured-data.helper';

import {
  contentBodyClass,
  contentSectionClass,
  contentSectionTitleClass,
  homeSectionsClass,
} from './content.variants';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslations('home');

  return {
    title: buildPageTitle(t('metaTitle')),
    description: t('metaDescription'),
    alternates: { canonical: ROUTE_PATHS.home },
    openGraph: { title: t('metaTitle'), description: t('metaDescription'), url: ROUTE_PATHS.home },
  };
}

/**
 * The homepage: the playable landing hero followed by substantial editorial
 * content — what Twinzy is, how a round works, the privacy design, the AI's
 * honest limits, the safety rules, how to read a result — and internal links
 * to every supporting page.
 */
const HomePage = async (): Promise<ReactElement> => {
  const t = await getServerTranslations();
  const webAppJson = serializeJsonLd(
    buildWebApplicationJsonLd(
      publicEnv.siteBaseUrl,
      t('app.name'),
      t('home.metaDescription'),
      publicEnv.paymentPriceValue,
      publicEnv.paymentPriceCurrency,
    ),
  );

  return (
    <PageContainer>
      <JsonLdScript json={webAppJson} />
      <LandingContainer />
      <Stack gap="md" className={homeSectionsClass}>
        {HOME_SECTION_KEYS.map((key) => (
          <section key={key} className={contentSectionClass}>
            <h2 className={contentSectionTitleClass}>{t(`home.${key}Title`)}</h2>
            <p className={contentBodyClass}>{t(`home.${key}Body1`)}</p>
            <p className={contentBodyClass}>{t(`home.${key}Body2`)}</p>
          </section>
        ))}
        <ContentLinks title={t('home.learnMoreTitle')}>
          {buildContentPageLinks((key) => t(key)).map((link) => (
            <ContentLinkItem key={link.href} href={link.href} label={link.label} />
          ))}
        </ContentLinks>
      </Stack>
    </PageContainer>
  );
};

export default HomePage;
