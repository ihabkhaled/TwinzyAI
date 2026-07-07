import type { GameStreamStageValue } from '@twinzy/shared';

/** Optional progress sink so the streaming flow can report matching stages. */
export type StyleMatchStageListener = (stage: GameStreamStageValue) => void;

/**
 * Progress sink for the text-only matching phase: stage milestones plus the
 * candidate public-figure names being considered ("rough examples"), reported
 * as they become available so the stream can render each step live.
 */
export interface StyleMatchProgressListener {
  onStage?: StyleMatchStageListener;
  onCandidates?: (names: readonly string[]) => void;
}
