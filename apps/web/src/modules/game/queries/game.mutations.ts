import type { GameStreamStageValue } from '@twinzy/shared';

import { useAppMutation } from '@/packages/query';

import type { AnalyzeGameMutation } from '../model/game.types';
import { analyzeImageStream } from '../services/game.service';

import { GAME_MUTATION_KEY } from './game-query-keys';

/**
 * Binds the streaming analyze service to the query cache and exposes a narrowed
 * surface (data/error/status + `analyze`/`reset`) so the orchestrator hook never
 * depends on the underlying query vendor's mutation type. Each pipeline stage is
 * reported through `onStage` while the mutation is pending, driving live
 * progress copy in the view.
 */
export const useAnalyzeGameMutation = (
  onStage: (stage: GameStreamStageValue) => void,
): AnalyzeGameMutation => {
  const mutation = useAppMutation({
    mutationKey: GAME_MUTATION_KEY,
    mutationFn: (file: File) => analyzeImageStream(file, onStage),
  });

  return {
    data: mutation.data,
    error: mutation.error,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    analyze: mutation.mutate,
    reset: mutation.reset,
  };
};
