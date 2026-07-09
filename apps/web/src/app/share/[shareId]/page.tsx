import type { Metadata } from 'next';
import type { ReactElement } from 'react';

import { SharePageContainer } from '@/modules/game';
import { getServerTranslations } from '@/packages/i18n';
import { PageContainer } from '@/packages/ui-primitives';
import { buildPageTitle } from '@/shared/helpers/page-title.helper';

/**
 * Temporary share pages are ephemeral and public-by-link, so they are NEVER
 * indexed and the Open Graph preview is deliberately generic and safe — no
 * per-user data, no uploaded image. Metadata is static (no fetch, nothing
 * stored) so a crawler request never touches the cache.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslations('share');

  return {
    title: buildPageTitle(t('metaTitle')),
    description: t('metaDescription'),
    robots: { index: false, follow: false },
    openGraph: { title: t('metaTitle'), description: t('metaDescription') },
  };
}

const SharePage = async ({
  params,
}: {
  params: Promise<{ shareId: string }>;
}): Promise<ReactElement> => {
  const { shareId } = await params;

  return (
    <PageContainer>
      <SharePageContainer shareId={shareId} />
    </PageContainer>
  );
};

export default SharePage;
