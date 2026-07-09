import type { ReactElement } from 'react';

import { Stack } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';
import { buildIndexedTestId } from '@/shared/testing/test-id.helper';

import { ResultCard } from '../components/result-card.component';
import { ResultDisclaimer } from '../components/result-disclaimer.component';
import { ResultList } from '../components/result-list.component';
import type { GameResultView, ResultLabels } from '../model/game.types';
import type { ResultSectionsProps } from '../model/game-component.types';

import { ImageQuality } from './image-quality.container';
import { ResultSummary } from './result-summary.container';
import { TraitDetails } from './trait-details.container';

/** The ranked style/vibe match cards (or the localized no-match fallback). */
const renderResultList = (view: GameResultView, labels: ResultLabels): ReactElement => (
  <ResultList
    title={view.resultCountTitle}
    fallbackTitle={labels.fallbackTitle}
    fallbackMessage={view.fallbackMessage}
    hasResults={view.hasResults}
    testId={TEST_IDS.resultList}
  >
    {view.results.map((result) => (
      <ResultCard
        key={result.rank}
        result={result}
        labels={labels}
        testId={buildIndexedTestId(TEST_IDS.resultCard, result.rank)}
      />
    ))}
  </ResultList>
);

/**
 * The shared, presentation-only result body reused by the in-game result view
 * and the public share page: compact summary, the grouped detailed-traits
 * accordion, image quality & uncertainty, the ranked matches, and the safety
 * disclaimer. A container so it may map the result list.
 */
export const ResultSections = ({
  view,
  labels,
  traitCountLabel,
}: ResultSectionsProps): ReactElement => (
  <Stack gap="md">
    <ResultSummary
      title={labels.compactSummaryTitle}
      traitCountLabel={traitCountLabel}
      summary={view.compactTraitSummary}
    />
    <TraitDetails title={labels.detailedTraitsTitle} categories={view.categories} />
    <ImageQuality
      title={labels.imageQualityTitle}
      uncertaintyTitle={labels.uncertaintyTitle}
      fields={view.imageQuality}
      uncertainty={view.uncertainty}
    />
    {renderResultList(view, labels)}
    <ResultDisclaimer disclaimer={view.disclaimer} testId={TEST_IDS.disclaimer} />
  </Stack>
);
