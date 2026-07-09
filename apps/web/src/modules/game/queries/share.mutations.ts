import type { FinalGameResult } from '@twinzy/shared';

import { useAppMutation } from '@/packages/query';

import { SHARE_CREATE_MUTATION_KEY } from '../model/share.constants';
import type { CreateShareMutation } from '../model/share.types';
import { createShareLink } from '../services/share.service';

/**
 * Binds the create-share service to the query cache and exposes a narrowed
 * surface so the hook never depends on the underlying mutation vendor type.
 * The image pipeline is never touched: this only posts the existing result.
 */
export const useCreateShareMutation = (): CreateShareMutation => {
  const mutation = useAppMutation({
    mutationKey: SHARE_CREATE_MUTATION_KEY,
    mutationFn: (result: FinalGameResult) => createShareLink(result),
  });

  return {
    isPending: mutation.isPending,
    isError: mutation.isError,
    create: (result, callbacks): void => {
      mutation.mutate(result, callbacks);
    },
    reset: mutation.reset,
  };
};
