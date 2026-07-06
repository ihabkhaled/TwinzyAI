import type { TraitKey, VerdictValue } from '@twinzy/shared';

import { TRAIT_LABEL_KEYS, VERDICT_LABEL_KEYS } from '../model/game.constants';
import { GamePhase, type GamePhaseValue } from '../model/game.enums';
import type {
  GameScreenLabels,
  LandingLabels,
  ResultView,
  TranslateMessage,
} from '../model/game.types';

/** Map the mutation status flags to the single phase the container renders. */
export const resolvePhase = (
  isPending: boolean,
  isSuccess: boolean,
  isError: boolean,
): GamePhaseValue => {
  if (isPending) {
    return GamePhase.Processing;
  }
  if (isSuccess) {
    return GamePhase.Success;
  }
  if (isError) {
    return GamePhase.Error;
  }
  return GamePhase.Setup;
};

/** Translated display label for a single extracted trait. */
export const resolveTraitLabel = (translate: TranslateMessage, key: TraitKey): string =>
  translate(TRAIT_LABEL_KEYS[key]);

/** Translated display label for a verdict band. */
export const resolveVerdictLabel = (translate: TranslateMessage, verdict: VerdictValue): string =>
  translate(VERDICT_LABEL_KEYS[verdict]);

/**
 * Safe share text: name + score only. Never the photo, never trait JSON, never
 * identity/biometric wording. Returns an empty string when there is no match.
 */
export const buildShareText = (
  results: readonly ResultView[],
  translate: TranslateMessage,
): string => {
  const top = results[0];
  if (top === undefined) {
    return '';
  }
  return translate('result.shareTemplate', { name: top.name, score: top.scorePercent });
};

/** Resolve every static string the game screen renders, in one pass. */
export const buildGameScreenLabels = (translate: TranslateMessage): GameScreenLabels => ({
  title: translate('game.title'),
  analyzeButton: translate('game.analyzeButton'),
  processingText: translate('game.processingText'),
  processingHint: translate('game.processingHint'),
  privacyNotice: translate('home.privacyNotice'),
  upload: {
    label: translate('upload.label'),
    hint: translate('upload.hint'),
    changeButton: translate('upload.changeButton'),
    cameraLabel: translate('upload.cameraLabel'),
    cameraHint: translate('upload.cameraHint'),
    consentLabel: translate('upload.consentLabel'),
    previewAlt: translate('upload.previewAlt'),
  },
  result: {
    title: translate('result.title'),
    traitsTitle: translate('result.traitsTitle'),
    scoreLabel: translate('result.scoreLabel'),
    reasonLabel: translate('result.reasonLabel'),
    matchingTraitsLabel: translate('result.matchingTraitsLabel'),
    weakTraitsLabel: translate('result.weakTraitsLabel'),
    rankLabel: translate('result.rankLabel'),
    fallbackTitle: translate('result.fallbackTitle'),
    retryButton: translate('result.retryButton'),
    shareButton: translate('result.shareButton'),
  },
});

/** Resolve every static string the landing section renders, in one pass. */
export const buildLandingLabels = (translate: TranslateMessage): LandingLabels => ({
  badge: translate('home.freeBadge'),
  tagline: translate('app.tagline'),
  subtitle: translate('app.subtitle'),
  startButton: translate('home.startButton'),
  howItWorksTitle: translate('home.howItWorksTitle'),
  steps: [translate('home.step1'), translate('home.step2'), translate('home.step3')],
  privacyNotice: translate('home.privacyNotice'),
});
