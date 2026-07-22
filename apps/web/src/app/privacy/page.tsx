import type { Metadata } from 'next';
import type { ReactElement } from 'react';

import { PrivacyNotice } from '@/modules/game';
import { getServerTranslations } from '@/packages/i18n';
import { PageContainer, Stack } from '@/packages/ui-primitives';
import { ContentLinkItem } from '@/shared/components/content/content-link-item.component';
import { ContentLinks } from '@/shared/components/content/content-links.component';
import { PRIVACY_SECTION_KEYS } from '@/shared/constants/content-pages.constants';
import { ROUTE_PATHS } from '@/shared/constants/route-paths.constants';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';
import { buildPageTitle } from '@/shared/helpers/page-title.helper';
import { buildContentPageLinks } from '@/shared/helpers/site-nav.helper';

import {
  contentBodyClass,
  contentLeadClass,
  contentListClass,
  contentSectionClass,
  contentSectionTitleClass,
  contentTitleClass,
} from '../content.variants';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslations('privacy');

  return { title: buildPageTitle(t('title')), description: t('metaDescription') };
}

/**
 * The full privacy policy: the photo's complete lifecycle, what is never
 * collected, every third-party service, the ads/cookies disclosure, and the
 * player's choices.
 */
const PrivacyPage = async (): Promise<ReactElement> => {
  const t = await getServerTranslations();

  return (
    <PageContainer>
      <Stack gap="md">
        <h1 className={contentTitleClass}>{t('privacy.title')}</h1>
        <p className={contentLeadClass}>{t('privacy.intro')}</p>
        <PrivacyNotice message={t('privacy.photoNotStored')} testId={TEST_IDS.privacyNotice} />
        <ul className={contentListClass}>
          <li>{t('privacy.traitsOnly')}</li>
          <li>{t('privacy.noFaceRecognition')}</li>
          <li>{t('privacy.noTemplates')}</li>
          <li>{t('privacy.geminiNote')}</li>
          <li>{t('privacy.funOnly')}</li>
          <li>{t('privacy.freeNote')}</li>
        </ul>
        {PRIVACY_SECTION_KEYS.map((key) => (
          <section key={key} className={contentSectionClass}>
            <h2 className={contentSectionTitleClass}>{t(`privacy.${key}Title`)}</h2>
            <p className={contentBodyClass}>{t(`privacy.${key}Body1`)}</p>
            <p className={contentBodyClass}>{t(`privacy.${key}Body2`)}</p>
          </section>
        ))}
        <ContentLinks title={t('home.learnMoreTitle')}>
          {buildContentPageLinks((key) => t(key), ROUTE_PATHS.privacy).map((link) => (
            <ContentLinkItem key={link.href} href={link.href} label={link.label} />
          ))}
        </ContentLinks>
      </Stack>
    </PageContainer>
  );
};

export default PrivacyPage;
