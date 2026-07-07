import type { ReactElement } from 'react';

import { Stack } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';
import { buildIndexedTestId } from '@/shared/testing/test-id.helper';

import { ResultCard } from '../components/result-card.component';
import { ResultDisclaimer } from '../components/result-disclaimer.component';
import { ResultList } from '../components/result-list.component';
import { RetryButton } from '../components/retry-button.component';
import { ShareButton } from '../components/share-button.component';
import { TraitItem } from '../components/trait-item.component';
import { TraitList } from '../components/trait-list.component';
import type { GameResultProps } from '../model/game-component.types';

/**
 * The success-phase view: ranked matches, extracted traits, the safety
 * disclaimer, and the share/retry actions. A container (not a component) so it
 * may map the view-model lists into their child components.
 */
export const GameResult = ({
  view,
  labels,
  shareFeedback,
  onShare,
  onRetry,
}: GameResultProps): ReactElement => {
  const resultNodes = view.results.map((result) => (
    <ResultCard
      key={result.rank}
      result={result}
      labels={labels}
      testId={buildIndexedTestId(TEST_IDS.resultCard, result.rank)}
    />
  ));
  const traitNodes = view.traits.map((trait, index) => (
    <TraitItem
      key={trait.key}
      label={trait.label}
      value={trait.value}
      testId={buildIndexedTestId(TEST_IDS.traitItem, index)}
    />
  ));

  return (
    <Stack gap="md">
      <ResultList
        title={labels.title}
        fallbackTitle={labels.fallbackTitle}
        fallbackMessage={view.fallbackMessage}
        hasResults={view.hasResults}
        testId={TEST_IDS.resultList}
      >
        {resultNodes}
      </ResultList>
      <TraitList title={labels.traitsTitle} testId={TEST_IDS.traitList}>
        {traitNodes}
      </TraitList>
      <ResultDisclaimer disclaimer={view.disclaimer} testId={TEST_IDS.disclaimer} />
      <Stack direction="row" gap="sm" align="center" wrap="wrap">
        {view.hasResults ? (
          <ShareButton
            label={labels.shareButton}
            feedback={shareFeedback}
            onShare={onShare}
            testId={TEST_IDS.shareButton}
          />
        ) : null}
        <RetryButton label={labels.retryButton} onRetry={onRetry} testId={TEST_IDS.retryButton} />
      </Stack>
    </Stack>
  );
};
