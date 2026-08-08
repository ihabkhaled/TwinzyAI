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

import {
  contentDefinitionListClass,
  contentDescriptionClass,
  contentTermClass,
  contentTitleClass,
} from '../content.variants';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslations('help');
  const alternates = await buildCurrentLocaleAlternates(ROUTE_PATHS.help);

  return {
    title: buildPageTitle(t('title')),
    description: t('a1'),
    alternates,
    openGraph: { title: t('title'), description: t('a1'), url: alternates.canonical },
  };
}

const HelpPage = async (): Promise<ReactElement> => {
  const t = await getServerTranslations();

  return (
    <PageContainer>
      <Stack gap="md">
        <h1 className={contentTitleClass}>{t('help.title')}</h1>
        <dl className={contentDefinitionListClass}>
          <div>
            <dt className={contentTermClass}>{t('help.q1')}</dt>
            <dd className={contentDescriptionClass}>{t('help.a1')}</dd>
          </div>
          <div>
            <dt className={contentTermClass}>{t('help.q2')}</dt>
            <dd className={contentDescriptionClass}>{t('help.a2')}</dd>
          </div>
          <div>
            <dt className={contentTermClass}>{t('help.q3')}</dt>
            <dd className={contentDescriptionClass}>{t('help.a3')}</dd>
          </div>
          <div>
            <dt className={contentTermClass}>{t('help.q4')}</dt>
            <dd className={contentDescriptionClass}>{t('help.a4')}</dd>
          </div>
          <div>
            <dt className={contentTermClass}>{t('help.q5')}</dt>
            <dd className={contentDescriptionClass}>{t('help.a5')}</dd>
          </div>
        </dl>
        <ContentLinks title={t('home.learnMoreTitle')}>
          {buildContentPageLinks((key) => t(key), ROUTE_PATHS.help).map((link) => (
            <ContentLinkItem key={link.href} href={link.href} label={link.label} />
          ))}
        </ContentLinks>
      </Stack>
    </PageContainer>
  );
};

export default HelpPage;
