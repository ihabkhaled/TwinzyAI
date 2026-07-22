import type { Metadata } from 'next';
import type { ReactElement } from 'react';

import { getServerTranslations } from '@/packages/i18n';
import { PageContainer, Stack } from '@/packages/ui-primitives';
import { ContentLinkItem } from '@/shared/components/content/content-link-item.component';
import { ContentLinks } from '@/shared/components/content/content-links.component';
import { ABOUT_SECTION_KEYS } from '@/shared/constants/content-pages.constants';
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
  const t = await getServerTranslations('about');

  return { title: buildPageTitle(t('metaTitle')), description: t('metaDescription') };
}

/** Who is behind Twinzy, why it exists, and the promises it is built around. */
const AboutPage = async (): Promise<ReactElement> => {
  const t = await getServerTranslations();

  return (
    <PageContainer>
      <Stack gap="md">
        <h1 className={contentTitleClass}>{t('about.title')}</h1>
        <p className={contentLeadClass}>{t('about.intro')}</p>
        {ABOUT_SECTION_KEYS.map((key) => (
          <section key={key} className={contentSectionClass}>
            <h2 className={contentSectionTitleClass}>{t(`about.${key}Title`)}</h2>
            <p className={contentBodyClass}>{t(`about.${key}Body1`)}</p>
            <p className={contentBodyClass}>{t(`about.${key}Body2`)}</p>
          </section>
        ))}
        <ContentLinks title={t('home.learnMoreTitle')}>
          {buildContentPageLinks((key) => t(key), ROUTE_PATHS.about).map((link) => (
            <ContentLinkItem key={link.href} href={link.href} label={link.label} />
          ))}
        </ContentLinks>
      </Stack>
    </PageContainer>
  );
};

export default AboutPage;
