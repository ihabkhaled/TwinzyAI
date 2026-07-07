import type { ReactElement } from 'react';

import { Card, Stack } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';
import { buildIndexedTestId } from '@/shared/testing/test-id.helper';

import { ProcessingCard } from '../components/processing-card.component';
import { TraitItem } from '../components/trait-item.component';
import { TraitList } from '../components/trait-list.component';
import type { GameProcessingProps } from '../model/game-component.types';

import {
  candidateChipClass,
  candidatesListClass,
  candidatesTitleClass,
} from './game-processing.variants';

/**
 * The live processing view: the animated status card plus the intermediate
 * payloads as they stream in — the extracted traits are "written down" the
 * moment they arrive, then the candidate names appear as rough matches being
 * considered. A container (not a component) so it may map the streamed lists.
 */
export const GameProcessing = ({
  stageLabel,
  hint,
  traitsTitle,
  candidatesTitle,
  traits,
  candidateNames,
}: GameProcessingProps): ReactElement => {
  const traitNodes = traits.map((trait, index) => (
    <TraitItem
      key={trait.key}
      label={trait.label}
      value={trait.value}
      testId={buildIndexedTestId(TEST_IDS.traitItem, index)}
    />
  ));
  const candidateNodes = candidateNames.map((name) => (
    <li key={name} className={candidateChipClass}>
      {name}
    </li>
  ));

  return (
    <Stack gap="md">
      <ProcessingCard stageLabel={stageLabel} hint={hint} testId={TEST_IDS.processing} />
      {traits.length > 0 ? (
        <TraitList title={traitsTitle} testId={TEST_IDS.traitList}>
          {traitNodes}
        </TraitList>
      ) : null}
      {candidateNames.length > 0 ? (
        <Card>
          <p className={candidatesTitleClass}>{candidatesTitle}</p>
          <ul className={candidatesListClass}>{candidateNodes}</ul>
        </Card>
      ) : null}
    </Stack>
  );
};
