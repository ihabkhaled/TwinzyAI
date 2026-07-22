import type { Metadata } from 'next';
import type { ReactElement } from 'react';

import { getServerTranslations } from '@/packages/i18n';
import { PageContainer, Stack } from '@/packages/ui-primitives';
import { ContentLinkItem } from '@/shared/components/content/content-link-item.component';
import { ContentLinks } from '@/shared/components/content/content-links.component';
import { JsonLdScript } from '@/shared/components/seo/json-ld.container';
import { FAQ_QUESTION_NUMBERS } from '@/shared/constants/content-pages.constants';
import { ROUTE_PATHS } from '@/shared/constants/route-paths.constants';
import { buildPageTitle } from '@/shared/helpers/page-title.helper';
import { buildContentPageLinks } from '@/shared/helpers/site-nav.helper';
import { buildFaqPageJsonLd, serializeJsonLd } from '@/shared/helpers/structured-data.helper';

import {
  contentDefinitionListClass,
  contentDescriptionClass,
  contentLeadClass,
  contentTermClass,
  contentTitleClass,
} from '../content.variants';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslations('faq');

  return {
    title: buildPageTitle(t('metaTitle')),
    description: t('metaDescription'),
    alternates: { canonical: ROUTE_PATHS.faq },
    openGraph: { title: t('metaTitle'), description: t('metaDescription'), url: ROUTE_PATHS.faq },
  };
}

/** The questions players actually ask, answered honestly and in full. */
const FaqPage = async (): Promise<ReactElement> => {
  const t = await getServerTranslations();
  const faqJson = serializeJsonLd(
    buildFaqPageJsonLd(FAQ_QUESTION_NUMBERS.map((n) => [t(`faq.q${n}`), t(`faq.a${n}`)] as const)),
  );

  return (
    <PageContainer>
      <JsonLdScript json={faqJson} />
      <Stack gap="md">
        <h1 className={contentTitleClass}>{t('faq.title')}</h1>
        <p className={contentLeadClass}>{t('faq.intro')}</p>
        <dl className={contentDefinitionListClass}>
          {FAQ_QUESTION_NUMBERS.map((n) => (
            <div key={n}>
              <dt className={contentTermClass}>{t(`faq.q${n}`)}</dt>
              <dd className={contentDescriptionClass}>{t(`faq.a${n}`)}</dd>
            </div>
          ))}
        </dl>
        <ContentLinks title={t('home.learnMoreTitle')}>
          {buildContentPageLinks((key) => t(key), ROUTE_PATHS.faq).map((link) => (
            <ContentLinkItem key={link.href} href={link.href} label={link.label} />
          ))}
        </ContentLinks>
      </Stack>
    </PageContainer>
  );
};

export default FaqPage;
