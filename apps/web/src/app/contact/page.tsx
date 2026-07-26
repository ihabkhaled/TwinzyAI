import type { Metadata } from 'next';
import type { ReactElement } from 'react';

import { getServerTranslations } from '@/packages/i18n';
import { PageContainer, Stack } from '@/packages/ui-primitives';
import { ROUTE_PATHS } from '@/shared/constants/route-paths.constants';
import { buildPageTitle } from '@/shared/helpers/page-title.helper';

import {
  contentBodyClass,
  contentLeadClass,
  contentSectionClass,
  contentSectionTitleClass,
  contentTitleClass,
} from '../content.variants';

import { ContactFormContainer } from './contact-form.container';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslations('about');
  return {
    title: buildPageTitle(t('contactTitle')),
    description: t('contactBody1'),
    alternates: { canonical: ROUTE_PATHS.contact },
  };
}

/** Privacy-safe contact form: SMTP delivery without Twinzy persistence. */
const ContactPage = async (): Promise<ReactElement> => {
  const t = await getServerTranslations();

  return (
    <PageContainer>
      <Stack gap="md">
        <h1 className={contentTitleClass}>{t('about.contactTitle')}</h1>
        <p className={contentLeadClass}>{t('about.contactBody1')}</p>
        <p className={contentBodyClass}>{t('about.contactBody2')}</p>
        <section className={contentSectionClass}>
          <h2 className={contentSectionTitleClass}>{t('about.contactTitle')}</h2>
          <ContactFormContainer />
        </section>
      </Stack>
    </PageContainer>
  );
};

export default ContactPage;
