import type { ReactElement } from 'react';

import type { PrivacyNoticeProps } from '../model/game-component.types';

import { privacyNoticeClass } from './privacy-notice.variants';

/** Short reassurance that the uploaded photo is never stored. */
export function PrivacyNotice({ message, testId }: Readonly<PrivacyNoticeProps>): ReactElement {
  return (
    <p className={privacyNoticeClass} data-testid={testId}>
      {message}
    </p>
  );
}
