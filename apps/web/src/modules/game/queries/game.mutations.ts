import { useAppMutation } from '@/packages/query';

import type { AnalyzeGameMutation } from '../model/game.types';
import { analyzeImage } from '../services/game.service';

import { GAME_MUTATION_KEY } from './game-query-keys';

/**
 * Binds the analyze service to the query cache and exposes a narrowed surface
 * (data/error/status + `analyze`/`reset`) so the orchestrator hook never
 * depends on the underlying query vendor's mutation type.
 */
export const useAnalyzeGameMutation = (): AnalyzeGameMutation => {
  const mutation = useAppMutation({ mutationKey: GAME_MUTATION_KEY, mutationFn: analyzeImage });

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
