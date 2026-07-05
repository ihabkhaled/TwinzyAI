import type { FinalGameResult } from '@twinzy/shared';
import { TRAIT_KEYS } from '@twinzy/shared';

import type { TranslationKey } from '@/i18n';
import { t } from '@/i18n';

import { TRAIT_LABEL_KEYS } from '../model/game.constants';
import type { GameResultView, ResultView, TraitView } from '../model/game.types';

const VERDICT_LABEL_KEYS: Record<string, TranslationKey> = {
  strong: 'game.verdict.strong',
  medium: 'game.verdict.medium',
  weak: 'game.verdict.weak',
};

/** Maps the backend DTO to the view model. UI never sees the raw DTO. */
export const mapFinalResultToView = (result: FinalGameResult): GameResultView => {
  const traits: TraitView[] = TRAIT_KEYS.map((key) => ({
    key,
    label: t(TRAIT_LABEL_KEYS[key]),
    value: result.traits[key],
  }));

  const results: ResultView[] = result.results.map((item) => ({
    name: item.name,
    rank: item.rank,
    scorePercent: item.finalStyleVibeFitScore,
    verdict: item.verdict,
    verdictLabel: t(VERDICT_LABEL_KEYS[item.verdict] ?? 'game.verdict.medium'),
    reason: item.reason,
    matchingTraits: item.matchingTraits,
    weakOrUncertainTraits: item.weakOrUncertainTraits,
  }));

  return {
    traits,
    results,
    fallbackMessage: result.fallbackMessage,
    disclaimer: result.disclaimer,
    shareText: buildShareText(results),
  };
};

/**
 * Safe share text: name + score only. Never the photo, never trait JSON,
 * never identity/biometric wording.
 */
export const buildShareText = (results: readonly ResultView[]): string => {
  const top = results[0];
  if (top === undefined) {
    return '';
  }
  return t('game.shareTemplate')
    .replace('{name}', top.name)
    .replace('{score}', String(top.scorePercent));
};
