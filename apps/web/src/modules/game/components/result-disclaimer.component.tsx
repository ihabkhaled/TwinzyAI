import type { ReactElement } from 'react';

import type { ResultDisclaimerProps } from '../model/game-component.types';

import { resultDisclaimerClass } from './result-disclaimer.variants';

/** The mandatory honesty disclaimer: entertainment-only resemblance, zero storage, no identification. */
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
