import { useAppMutation } from '@/packages/query';

import type { AnalyzeGameMutation, GameStreamHandlers } from '../model/game.types';
import { analyzeImageStream } from '../services/game.service';

import { GAME_MUTATION_KEY } from './game-query-keys';

/**
 * Binds the streaming analyze service to the query cache and exposes a narrowed
 * surface (data/error/status + `analyze`/`reset`) so the orchestrator hook never
 * depends on the underlying query vendor's mutation type. Pipeline stages and
 * intermediate payloads (traits, candidates) are reported through `handlers`
 * while the mutation is pending, driving live progress in the view.
 */
export const useAnalyzeGameMutation = (handlers: GameStreamHandlers): AnalyzeGameMutation => {
  const mutation = useAppMutation({
    mutationKey: GAME_MUTATION_KEY,
    mutationFn: (file: File) => analyzeImageStream(file, handlers),
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
