import type { Metadata } from 'next';
import type { ReactElement } from 'react';

import { publicEnv } from '@/packages/env';
import { getServerTranslations } from '@/packages/i18n';
import { notFound } from '@/packages/navigation';
import { PageContainer, Stack } from '@/packages/ui-primitives';
import { ContentLinkItem } from '@/shared/components/content/content-link-item.component';
import { ContentLinks } from '@/shared/components/content/content-links.component';
import { JsonLdScript } from '@/shared/components/seo/json-ld.container';
import {
  buildGuidePath,
  GUIDE_NAMESPACE_BY_SLUG,
  GUIDE_SECTION_KEYS,
  GUIDE_SLUGS,
  GUIDE_TIP_NUMBERS,
  type GuideSlug,
  isGuideSlug,
  RELATED_GUIDE_SLUGS,
} from '@/shared/constants/guides.constants';
import { ROUTE_PATHS } from '@/shared/constants/route-paths.constants';
import { buildContentPageMetadata } from '@/shared/helpers/content-page-metadata.helper';
import {
  buildBreadcrumbListJsonLd,
  serializeJsonLd,
} from '@/shared/helpers/structured-data.helper';

import {
  contentBodyClass,
  contentLeadClass,
  contentListClass,
  contentSectionClass,
  contentSectionTitleClass,
  contentTitleClass,
} from '../../content.variants';

interface GuidePageParams {
  params: Promise<{ slug: string }>;
}

/** Every guide slug is statically generated at build time. */
export function generateStaticParams(): { slug: string }[] {
  return GUIDE_SLUGS.map((slug) => ({ slug }));
}

/** Narrow a route param to a known guide slug, or render the 404 page. */
const resolveSlug = (slug: string): GuideSlug => {
  if (!isGuideSlug(slug)) {
    notFound();
  }
  return slug;
};

export async function generateMetadata({ params }: GuidePageParams): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = resolveSlug(rawSlug);
  const namespace = GUIDE_NAMESPACE_BY_SLUG[slug];
  const t = await getServerTranslations();

  return buildContentPageMetadata({
    path: buildGuidePath(slug),
    title: t(`guides.${namespace}.metaTitle`),
    description: t(`guides.${namespace}.metaDescription`),
  });
}

/** One long-form guide: intro, four sections, a takeaway checklist, and related guides. */
const GuidePage = async ({ params }: GuidePageParams): Promise<ReactElement> => {
  const { slug: rawSlug } = await params;
  const slug = resolveSlug(rawSlug);
  const namespace = GUIDE_NAMESPACE_BY_SLUG[slug];
  const t = await getServerTranslations();
  const guideText = (suffix: string): string => t(`guides.${namespace}.${suffix}`);

  const breadcrumbJson = serializeJsonLd(
    buildBreadcrumbListJsonLd(publicEnv.siteBaseUrl, [
      [t('nav.home'), ROUTE_PATHS.home],
      [t('nav.guides'), ROUTE_PATHS.guides],
      [guideText('navTitle'), buildGuidePath(slug)],
    ]),
  );

  return (
    <PageContainer>
      <JsonLdScript json={breadcrumbJson} />
      <Stack gap="md">
        <h1 className={contentTitleClass}>{guideText('title')}</h1>
        <p className={contentLeadClass}>{guideText('intro')}</p>
        {GUIDE_SECTION_KEYS.map((sectionKey) => (
          <section key={sectionKey} className={contentSectionClass}>
            <h2 className={contentSectionTitleClass}>{guideText(`${sectionKey}Title`)}</h2>
            <p className={contentBodyClass}>{guideText(`${sectionKey}Body1`)}</p>
            <p className={contentBodyClass}>{guideText(`${sectionKey}Body2`)}</p>
          </section>
        ))}
        <ul className={contentListClass}>
          {GUIDE_TIP_NUMBERS.map((tipNumber) => (
            <li key={tipNumber}>{guideText(`tip${tipNumber}`)}</li>
          ))}
        </ul>
        <ContentLinks title={t('home.learnMoreTitle')}>
          {RELATED_GUIDE_SLUGS[slug].map((relatedSlug) => {
            const relatedNamespace = GUIDE_NAMESPACE_BY_SLUG[relatedSlug];
            return (
              <ContentLinkItem
                key={relatedSlug}
                href={buildGuidePath(relatedSlug)}
                label={t(`guides.${relatedNamespace}.navTitle`)}
              />
            );
          })}
        </ContentLinks>
      </Stack>
    </PageContainer>
  );
};

export default GuidePage;
