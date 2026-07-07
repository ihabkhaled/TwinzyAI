'use client';
// client-boundary-reason: owns the live streaming-progress state (stage, extracted traits, candidate names) updated as SSE events arrive.

import { useCallback, useMemo, useState } from 'react';

import type { GameStreamStageValue, Traits } from '@twinzy/shared';

import type { GameStreamHandlers, StreamProgressController } from '../model/game.types';

/**
 * Owns the mid-pipeline progress the streaming analyze request reports: the
 * current stage, the extracted traits, and the candidate names. Exposes the
 * stream {@link GameStreamHandlers} (stable) plus a `reset` for each new run,
 * keeping the orchestrator hook small.
 */
export const useStreamProgress = (): StreamProgressController => {
  const [currentStage, setCurrentStage] = useState<GameStreamStageValue | undefined>();
  const [traits, setTraits] = useState<Traits | undefined>();
  const [candidateNames, setCandidateNames] = useState<readonly string[]>([]);

  const handlers = useMemo<GameStreamHandlers>(
    () => ({
      onStage: (stage): void => {
        setCurrentStage(stage);
      },
      onTraits: (next): void => {
        setTraits(next);
      },
      onCandidates: (names): void => {
        setCandidateNames(names);
      },
    }),
    [],
  );

  const reset = useCallback((): void => {
    setCurrentStage(undefined);
    setTraits(undefined);
    setCandidateNames([]);
  }, []);

  return { handlers, currentStage, traits, candidateNames, reset };
};
