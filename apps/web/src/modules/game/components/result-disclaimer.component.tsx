import type { ReactElement } from 'react';

import type { ResultDisclaimerProps } from '../model/game-component.types';

import { resultDisclaimerClass } from './result-disclaimer.variants';

/** The mandatory "not face recognition / not biometric" safety disclaimer. */
export function ResultDisclaimer({
  disclaimer,
  testId,
}: Readonly<ResultDisclaimerProps>): ReactElement {
  return (
    <p className={resultDisclaimerClass} data-testid={testId}>
      {disclaimer}
    </p>
  );
}
