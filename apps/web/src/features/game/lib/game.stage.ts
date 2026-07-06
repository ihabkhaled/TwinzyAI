import type { GameStreamStageValue } from '@twinzy/shared';

import { t } from '@/i18n';

import { STAGE_LABEL_KEYS } from '../model/game.constants';

/**
 * Friendly progress copy for a streamed pipeline stage. Falls back to the
 * generic processing text when no stage has been reported yet.
 */
export const stageLabel = (stage: GameStreamStageValue | undefined): string =>
  stage === undefined ? t('game.processingText') : t(STAGE_LABEL_KEYS[stage]);
