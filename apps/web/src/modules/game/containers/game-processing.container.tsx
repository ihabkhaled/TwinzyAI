import type { ReactElement } from 'react';

import { Card, Stack } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import { ProcessingCard } from '../components/processing-card.component';
import type { GameProcessingProps } from '../model/game-component.types';

import { chipClass, chipListClass } from './chips.variants';
import { candidatesTitleClass } from './game-processing.variants';

/**
 * The live processing view: the animated status card plus the intermediate
 * payloads as they stream in — the trait count and strongest written signals
 * are "written down" the moment they arrive, then the candidate names appear
 * as rough matches being considered. A container so it may map the lists.
 */
export const GameProcessing = ({
  stageLabel,
  hint,
  traitsTitle,
  candidatesTitle,
  traitCountLabel,
  summary,
  candidateNames,
}: GameProcessingProps): ReactElement => {
  const summaryChips = summary.map((signal) => (
    <li key={signal} className={chipClass}>
      {signal}
    </li>
  ));
  const candidateChips = candidateNames.map((name) => (
    <li key={name} className={chipClass}>
      {name}
    </li>
  ));

  return (
    <Stack gap="md">
      <ProcessingCard stageLabel={stageLabel} hint={hint} testId={TEST_IDS.processing} />
      {summary.length > 0 ? (
        <Card testId={TEST_IDS.compactSummary}>
          <p className={candidatesTitleClass}>{traitsTitle}</p>
          {traitCountLabel === undefined ? null : (
            <p className={candidatesTitleClass} data-testid={TEST_IDS.traitCount}>
              {traitCountLabel}
            </p>
          )}
          <ul className={chipListClass}>{summaryChips}</ul>
        </Card>
      ) : null}
      {candidateNames.length > 0 ? (
        <Card>
          <p className={candidatesTitleClass}>{candidatesTitle}</p>
          <ul className={chipListClass}>{candidateChips}</ul>
        </Card>
      ) : null}
    </Stack>
  );
};
