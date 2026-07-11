import type {
  ConfidenceLevelValue,
  GameStreamStageValue,
  PublicCategoryValue,
  TraitCategoryKey,
  UncertaintyNoteField,
  VerdictValue,
} from '@twinzy/shared';

import {
  buildTraitFieldLabelKey,
  CONFIDENCE_LABEL_KEYS,
  PUBLIC_CATEGORY_LABEL_KEYS,
  STAGE_LABEL_KEYS,
  TRAIT_CATEGORY_LABEL_KEYS,
  UNCERTAINTY_LABEL_KEYS,
  VERDICT_LABEL_KEYS,
} from '../model/game.constants';
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

/**
 * Live progress copy for a streamed pipeline stage. Falls back to the generic
 * processing text before any stage has been reported.
 */
export const resolveStageLabel = (
  translate: TranslateMessage,
  stage: GameStreamStageValue | undefined,
): string => translate(stage === undefined ? 'game.processingText' : STAGE_LABEL_KEYS[stage]);

/**
 * The full error copy for the error phase: the friendly per-code message,
 * prefixed with WHICH pipeline step failed when the backend reported one — the
 * user always knows where the run stopped, never just "something went wrong".
 */
export const composeErrorMessage = (
  translate: TranslateMessage,
  friendlyKey: string,
  failedStage: GameStreamStageValue | undefined,
): string => {
  const friendly = translate(friendlyKey);
  if (failedStage === undefined) {
    return friendly;
  }
  const stageLabel = translate(STAGE_LABEL_KEYS[failedStage]);
  return `${translate('errors.failedDuringStage', { stage: stageLabel })} ${friendly}`;
};

/** Translated accordion title for one trait category. */
export const resolveTraitCategoryTitle = (
  translate: TranslateMessage,
  category: TraitCategoryKey,
): string => translate(TRAIT_CATEGORY_LABEL_KEYS[category]);

/** Translated display label for one trait field inside a category. */
export const resolveTraitFieldLabel = (
  translate: TranslateMessage,
  category: TraitCategoryKey,
  field: string,
): string => translate(buildTraitFieldLabelKey(category, field));

/** Translated label for one uncertainty-notes group. */
export const resolveUncertaintyLabel = (
  translate: TranslateMessage,
  field: UncertaintyNoteField,
): string => translate(UNCERTAINTY_LABEL_KEYS[field]);

/** Translated display label for a verdict band. */
export const resolveVerdictLabel = (translate: TranslateMessage, verdict: VerdictValue): string =>
  translate(VERDICT_LABEL_KEYS[verdict]);

/** Translated display label for a confidence band. */
export const resolveConfidenceLabel = (
  translate: TranslateMessage,
  confidence: ConfidenceLevelValue,
): string => translate(CONFIDENCE_LABEL_KEYS[confidence]);

/** Translated display label for a public-figure category. */
export const resolveCategoryLabel = (
  translate: TranslateMessage,
  category: PublicCategoryValue,
): string => translate(PUBLIC_CATEGORY_LABEL_KEYS[category]);

/** Translate an optional message key; undefined stays undefined. */
export const translateOptionalKey = (
  translate: TranslateMessage,
  key: string | undefined,
): string | undefined => (key === undefined ? undefined : translate(key));

/** Localized "Traits read: N" line (ICU number). */
export const resolveTraitCountLabel = (translate: TranslateMessage, count: number): string =>
  translate('game.traitCount', { count });

/** Localized "Showing up to N matches" line (ICU number) above the result list. */
export const resolveResultCountTitle = (translate: TranslateMessage, count: number): string =>
  translate('result.resultCountTitle', { count });

/**
 * Safe share text: name + score only. Never the photo, never trait JSON, never
 * identity claims. Returns an empty string when there is no match.
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
  liveTraitsTitle: translate('game.liveTraitsTitle'),
  liveCandidatesTitle: translate('game.liveCandidatesTitle'),
  resultCount: {
    label: translate('game.resultCountLabel'),
    hint: translate('game.resultCountHint'),
  },
  translating: translate('game.translating'),
  translatingHint: translate('game.translatingHint'),
  retrySamePhoto: translate('game.retrySamePhoto'),
  cancelProcessing: translate('game.cancelProcessing'),
  retryTranslation: translate('game.retryTranslation'),
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
  camera: {
    title: translate('game.cameraTitle'),
    previewLabel: translate('game.cameraPreviewLabel'),
    starting: translate('game.cameraStarting'),
    captureButton: translate('game.cameraCaptureButton'),
    cancelButton: translate('game.cameraCancelButton'),
  },
  result: {
    title: translate('result.title'),
    compactSummaryTitle: translate('game.compactSummaryTitle'),
    detailedTraitsTitle: translate('game.detailedTraitsTitle'),
    imageQualityTitle: translate('game.imageQualityTitle'),
    uncertaintyTitle: translate('game.uncertaintyTitle'),
    scoreLabel: translate('result.scoreLabel'),
    reasonLabel: translate('result.reasonLabel'),
    matchingTraitsLabel: translate('result.matchingTraitsLabel'),
    weakTraitsLabel: translate('result.weakTraitsLabel'),
    mismatchLabel: translate('result.mismatchLabel'),
    listSeparator: translate('result.listSeparator'),
    rankLabel: translate('result.rankLabel'),
    fallbackTitle: translate('result.fallbackTitle'),
    retryButton: translate('result.retryButton'),
    shareButton: translate('result.shareButton'),
    donateLabel: translate('result.donate'),
    scoreExplanation: translate('result.scoreExplanation'),
    uncertaintyExplanation: translate('result.uncertaintyExplanation'),
    mismatchExplanation: translate('result.mismatchExplanation'),
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
