import type { FinalGameResult, FinalResultItem } from '@twinzy/shared';

import {
  buildShareText,
  resolveTraitLabel,
  resolveVerdictLabel,
} from '../helpers/game-display.helper';
import { TRAIT_KEYS } from '../model/game.constants';
import type { GameResultView, ResultView, TraitView, TranslateMessage } from '../model/game.types';

/** Shape one backend match into its translated, display-ready view. */
const toResultView = (item: FinalResultItem, translate: TranslateMessage): ResultView => ({
  name: item.name,
  rank: item.rank,
  scorePercent: item.finalStyleVibeFitScore,
  verdict: item.verdict,
  verdictLabel: resolveVerdictLabel(translate, item.verdict),
  reason: item.reason,
  matchingTraits: item.matchingTraits,
  weakOrUncertainTraits: item.weakOrUncertainTraits,
});

/**
 * Map the backend DTO to the view model — the UI never sees the raw DTO.
 * Translations are injected so this stays a pure function (no i18n hook).
 */
export const mapFinalResultToView = (
  result: FinalGameResult,
  translate: TranslateMessage,
): GameResultView => {
  const traits: TraitView[] = TRAIT_KEYS.map((key) => ({
    key,
    label: resolveTraitLabel(translate, key),
    value: result.traits[key],
  }));

  const results: ResultView[] = result.results.map((item) => toResultView(item, translate));

  return {
    traits,
    results,
    fallbackMessage: result.fallbackMessage,
    disclaimer: result.disclaimer,
    hasResults: results.length > 0,
    shareText: buildShareText(results, translate),
  };
};
