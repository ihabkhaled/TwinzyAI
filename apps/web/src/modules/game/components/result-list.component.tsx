import type { ReactElement } from 'react';

import { Alert } from '@/packages/ui-primitives';

import type { ResultListProps } from '../model/game-component.types';

import {
  resultFallbackTitleClass,
  resultListStackClass,
  resultListTitleClass,
} from './result-list.variants';

/** Frames the ranked matches, or a friendly fallback when none were confident. */
export function ResultList({
  title,
  fallbackTitle,
  fallbackMessage,
  hasResults,
  children,
  testId,
}: Readonly<ResultListProps>): ReactElement {
  return (
    <section aria-label={title} data-testid={testId}>
      <h2 className={resultListTitleClass}>{title}</h2>
      {hasResults ? (
        <div className={resultListStackClass}>{children}</div>
      ) : (
        <Alert tone="info">
          <span className={resultFallbackTitleClass}>{fallbackTitle}</span>
          {fallbackMessage}
        </Alert>
      )}
    </section>
  );
}
