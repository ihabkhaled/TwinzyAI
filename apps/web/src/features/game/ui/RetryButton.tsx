import type { ReactNode } from 'react';

import { Button } from '@/components/ui';
import { t } from '@/i18n';

interface RetryButtonProps {
  onRetry: () => void;
}

export const RetryButton = ({ onRetry }: RetryButtonProps): ReactNode => (
  <Button variant="secondary" onClick={onRetry}>
    {t('game.retryButton')}
  </Button>
);
