import type { ReactNode } from 'react';

import { Button } from '@/components/ui';
import { t } from '@/i18n';

interface ShareResultButtonProps {
  onShare: () => void;
  feedback: string | undefined;
}

export const ShareResultButton = ({ onShare, feedback }: ShareResultButtonProps): ReactNode => (
  <div className="flex items-center gap-3">
    <Button onClick={onShare}>{t('game.shareButton')}</Button>
    {feedback !== undefined && (
      <span role="status" className="text-sm text-success">
        {feedback}
      </span>
    )}
  </div>
);
