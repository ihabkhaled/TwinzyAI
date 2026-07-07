import type { ReactElement } from 'react';

import { getServerTranslations } from '@/packages/i18n';
import { PageContainer } from '@/packages/ui-primitives';
import { LoadingState } from '@/shared/components/feedback/loading-state.component';

const Loading = async (): Promise<ReactElement> => {
  const t = await getServerTranslations('app');

  return (
    <PageContainer>
      <LoadingState label={t('loading')} />
    </PageContainer>
  );
};

export default Loading;
