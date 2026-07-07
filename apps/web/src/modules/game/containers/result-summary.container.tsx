import type { ReactElement } from 'react';

import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import type { ResultSummaryProps } from '../model/game-component.types';

import { chipClass, chipListClass } from './chips.variants';
import { summaryTitleClass } from './game-result.variants';

/**
 * The compact "strongest signals" section: section title, localized trait
 * count, and the summary chips. A container so it may map the chip list.
 */
export const ResultSummary = ({
  title,
  traitCountLabel,
  summary,
}: ResultSummaryProps): ReactElement => (
  <section data-testid={TEST_IDS.compactSummary}>
    <h2 className={summaryTitleClass}>{title}</h2>
    <p className={summaryTitleClass} data-testid={TEST_IDS.traitCount}>
      {traitCountLabel}
    </p>
    <ul className={chipListClass}>
      {summary.map((signal) => (
        <li key={signal} className={chipClass}>
          {signal}
        </li>
      ))}
    </ul>
  </section>
);
