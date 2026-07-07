import type { Metadata } from 'next';
import type { ReactElement } from 'react';

import { getServerTranslations } from '@/packages/i18n';
import { AppLink } from '@/packages/link';
import { PageContainer, Stack } from '@/packages/ui-primitives';
import { EmptyState } from '@/shared/components/feedback/empty-state.component';
import { ROUTE_PATHS } from '@/shared/constants/route-paths.constants';
import { buildPageTitle } from '@/shared/helpers/page-title.helper';

import { contentTitleClass } from './content.variants';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslations('notFound');

  return { title: buildPageTitle(t('title')) };
}

const NotFound = async (): Promise<ReactElement> => {
  const t = await getServerTranslations('notFound');

  return (
    <PageContainer>
      <Stack gap="md">
        <h1 className={contentTitleClass}>{t('title')}</h1>
        <EmptyState message={t('description')} />
        <AppLink href={ROUTE_PATHS.home}>{t('backHome')}</AppLink>
      </Stack>
    </PageContainer>
  );
};

export default NotFound;
