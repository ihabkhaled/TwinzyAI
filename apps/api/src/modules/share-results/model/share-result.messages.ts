import type { ErrorMessageKey } from '../../../core/errors';

/**
 * User-facing (already safe) messages + their i18n keys for the share feature.
 * Not-found and expired intentionally share ONE message/key so a direct visit
 * never reveals whether an id ever existed (no existence oracle).
 */
export const SHARE_NOT_FOUND_MESSAGE = 'This shared result has expired or was not found.';
export const SHARE_NOT_FOUND_MESSAGE_KEY: ErrorMessageKey = 'errors.share.notFound';

export const SHARE_PAYLOAD_TOO_LARGE_MESSAGE = 'This result is too large to share.';
export const SHARE_PAYLOAD_TOO_LARGE_MESSAGE_KEY: ErrorMessageKey = 'errors.share.payloadTooLarge';

export const SHARE_RESULT_UNSAFE_MESSAGE = 'This result cannot be shared.';
export const SHARE_RESULT_UNSAFE_MESSAGE_KEY: ErrorMessageKey = 'errors.share.unsafe';

export const SHARE_CAPACITY_MESSAGE =
  'Too many active shared results right now. Please try again shortly.';
export const SHARE_CAPACITY_MESSAGE_KEY: ErrorMessageKey = 'errors.share.capacity';

/** Log context tag for the share-results module. */
export const SHARE_LOG_CONTEXT = 'ShareResults';
