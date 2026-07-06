import type { GameStreamStageValue } from '@twinzy/shared';

/** Optional progress sink so the streaming flow can report matching stages. */
export type StyleMatchStageListener = (stage: GameStreamStageValue) => void;
