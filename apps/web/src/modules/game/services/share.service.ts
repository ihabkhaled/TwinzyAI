import type {
  CreateShareResultResponse,
  FinalGameResult,
  ShareResultResponse,
} from '@twinzy/shared';

import { createShareResultRequest, getShareResultRequest } from '../gateway/share.gateway';

/**
 * Frontend orchestration (React-free) for temporary sharing. Thin by design:
 * the create/read contracts are fully enforced at the gateway, so the service
 * is the stable seam the query/mutation layers depend on.
 */
export const createShareLink = (result: FinalGameResult): Promise<CreateShareResultResponse> =>
  createShareResultRequest(result);

export const fetchSharedResult = (shareId: string): Promise<ShareResultResponse> =>
  getShareResultRequest(shareId);
