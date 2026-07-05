import type { ChangeEvent, ReactNode } from 'react';

import { Checkbox } from '@/components/ui';
import { t } from '@/i18n';

interface UploadConsentCardProps {
  consentGiven: boolean;
  onConsentChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const UploadConsentCard = ({
  consentGiven,
  onConsentChange,
}: UploadConsentCardProps): ReactNode => (
  <Checkbox
    id="game-consent"
    label={t('game.consentLabel')}
    checked={consentGiven}
    onChange={onConsentChange}
  />
);
