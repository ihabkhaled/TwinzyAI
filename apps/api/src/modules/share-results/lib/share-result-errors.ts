import {
  ErrorCode,
  NotFoundError,
  PayloadTooLargeError,
  TooManyRequestsError,
  ValidationError,
} from '../../../core/errors';
import {
  SHARE_CAPACITY_MESSAGE,
  SHARE_CAPACITY_MESSAGE_KEY,
  SHARE_NOT_FOUND_MESSAGE,
  SHARE_NOT_FOUND_MESSAGE_KEY,
  SHARE_PAYLOAD_TOO_LARGE_MESSAGE,
  SHARE_PAYLOAD_TOO_LARGE_MESSAGE_KEY,
  SHARE_RESULT_UNSAFE_MESSAGE,
  SHARE_RESULT_UNSAFE_MESSAGE_KEY,
} from '../model/share-result.messages';

/** 404 for a missing OR expired share — one shape, so existence never leaks. */
export const shareNotFoundError = (): NotFoundError =>
  new NotFoundError(SHARE_NOT_FOUND_MESSAGE, SHARE_NOT_FOUND_MESSAGE_KEY, ErrorCode.ShareNotFound);

/** 413 when the result JSON exceeds the configured byte budget. */
export const sharePayloadTooLargeError = (): PayloadTooLargeError =>
  new PayloadTooLargeError(
    SHARE_PAYLOAD_TOO_LARGE_MESSAGE,
    SHARE_PAYLOAD_TOO_LARGE_MESSAGE_KEY,
    ErrorCode.SharePayloadTooLarge,
  );

/** 400 when the result carries forbidden wording or embedded image bytes. */
export const shareResultUnsafeError = (): ValidationError =>
  new ValidationError(
    SHARE_RESULT_UNSAFE_MESSAGE,
    SHARE_RESULT_UNSAFE_MESSAGE_KEY,
    ErrorCode.ShareResultUnsafe,
  );

/** 429 when the bounded cache is at capacity — retry shortly. */
export const shareCapacityError = (): TooManyRequestsError =>
  new TooManyRequestsError(
    SHARE_CAPACITY_MESSAGE,
    SHARE_CAPACITY_MESSAGE_KEY,
    ErrorCode.ShareCapacityReached,
  );
