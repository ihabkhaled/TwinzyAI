import type { Metadata } from 'next';
import type { ReactElement } from 'react';

import { GameContainer } from '@/modules/game';
import { getServerTranslations } from '@/packages/i18n';
import { PageContainer } from '@/packages/ui-primitives';
import { buildPageTitle } from '@/shared/helpers/page-title.helper';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslations('game');

  return { title: buildPageTitle(t('title')) };
}

const GamePage = (): ReactElement => (
  <PageContainer>
    <GameContainer />
  </PageContainer>
);

export default GamePage;
