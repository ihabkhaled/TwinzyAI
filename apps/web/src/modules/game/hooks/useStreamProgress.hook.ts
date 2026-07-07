'use client';
// client-boundary-reason: owns the live streaming-progress state (stage, trait count + summary, candidate names) updated as SSE events arrive.

import { useCallback, useMemo, useState } from 'react';

import type { GameStreamStageValue } from '@twinzy/shared';

import type {
  GameStreamHandlers,
  StreamProgressController,
  TraitsProgress,
} from '../model/game.types';

/**
 * Owns the mid-pipeline progress the streaming analyze request reports: the
 * current stage, the trait count + compact summary, and the candidate names.
 * Exposes the stream {@link GameStreamHandlers} (stable) plus a `reset` for
 * each new run, keeping the orchestrator hook small.
 */
export const useStreamProgress = (): StreamProgressController => {
  const [currentStage, setCurrentStage] = useState<GameStreamStageValue | undefined>();
  const [traitsProgress, setTraitsProgress] = useState<TraitsProgress | undefined>();
  const [candidateNames, setCandidateNames] = useState<readonly string[]>([]);

  const handlers = useMemo<GameStreamHandlers>(
    () => ({
      onStage: (stage): void => {
        setCurrentStage(stage);
      },
      onTraits: (progress): void => {
        setTraitsProgress(progress);
      },
      onCandidates: (names): void => {
        setCandidateNames(names);
      },
    }),
    [],
  );

  const reset = useCallback((): void => {
    setCurrentStage(undefined);
    setTraitsProgress(undefined);
    setCandidateNames([]);
  }, []);

  return { handlers, currentStage, traitsProgress, candidateNames, reset };
};
