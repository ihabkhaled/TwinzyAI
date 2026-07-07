'use client';
// client-boundary-reason: a route error boundary receives the caught error plus a reset callback and re-renders the failed segment in the browser.

import type { ReactElement } from 'react';

import { useAppTranslation } from '@/packages/i18n';
import { PageContainer } from '@/packages/ui-primitives';
import { ErrorState } from '@/shared/components/feedback/error-state.component';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';
import { useRouteErrorLogger } from '@/shared/hooks/useRouteErrorLogger.hook';

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const RouteError = ({ error, reset }: RouteErrorProps): ReactElement => {
  const t = useAppTranslation();
  useRouteErrorLogger(error);

  return (
    <PageContainer>
      <ErrorState
        message={t('errorPage.description')}
        retryLabel={t('errorPage.retry')}
        onRetry={reset}
        testId={TEST_IDS.errorState}
      />
    </PageContainer>
  );
};

export default RouteError;
