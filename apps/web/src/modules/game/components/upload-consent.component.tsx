import type { ReactElement } from 'react';

import { Checkbox } from '@/packages/ui-primitives';

import { CONSENT_INPUT_ID } from '../model/game.constants';
import type { UploadConsentProps } from '../model/game-component.types';

/** Consent checkbox; the user confirms this is a playful, no-storage game. */
export function UploadConsent({
  consentLabel,
  checked,
  onChange,
  testId,
}: Readonly<UploadConsentProps>): ReactElement {
  return (
    <Checkbox
      id={CONSENT_INPUT_ID}
      label={consentLabel}
      checked={checked}
      onChange={onChange}
      testId={testId}
    />
  );
}
