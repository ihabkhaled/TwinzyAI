import type {
  CreateShareResultResponse,
  FinalGameResult,
  ShareResultResponse,
} from '@twinzy/shared';
import {
  CreateShareResultResponseSchema,
  SHARE_RESULTS_PATH,
  ShareResultResponseSchema,
} from '@twinzy/shared';

import { getJson, httpClient, postJson } from '@/packages/axios';

import { SHARE_CREATE_TIMEOUT_MS } from '../model/share.constants';

/**
 * Creates a temporary share record from an existing result and returns its
 * public-link metadata. Only the safe result JSON is posted — no image, no file
 * slot — and the response contract is zod-enforced.
 */
export const createShareResultRequest = (
  result: FinalGameResult,
): Promise<CreateShareResultResponse> =>
  postJson(httpClient, SHARE_RESULTS_PATH, { result }, CreateShareResultResponseSchema, {
    timeout: SHARE_CREATE_TIMEOUT_MS,
  });

/**
 * Reads a temporary share by its UUID. The id is URL-encoded defensively (the
 * server re-validates it as a UUID); a 404 for an expired/unknown share
 * rethrows as the normalized HttpError for the page to branch on.
 */
export const getShareResultRequest = (shareId: string): Promise<ShareResultResponse> =>
  getJson(
    httpClient,
    `${SHARE_RESULTS_PATH}/${encodeURIComponent(shareId)}`,
    ShareResultResponseSchema,
  );
