import { isHttpError } from '@/packages/axios';

import { ERROR_MESSAGE_KEYS, type ErrorMessageKey } from './error-keys.constants';

const UNAUTHORIZED_STATUS = 401;
const FORBIDDEN_STATUS = 403;
const NOT_FOUND_STATUS = 404;
const PAYLOAD_TOO_LARGE_STATUS = 413;
const SERVER_ERROR_FLOOR = 500;

const STATUS_MESSAGE_KEYS: Record<number, ErrorMessageKey> = {
  [UNAUTHORIZED_STATUS]: ERROR_MESSAGE_KEYS.unauthorized,
  [FORBIDDEN_STATUS]: ERROR_MESSAGE_KEYS.forbidden,
  [NOT_FOUND_STATUS]: ERROR_MESSAGE_KEYS.notFound,
  [PAYLOAD_TOO_LARGE_STATUS]: ERROR_MESSAGE_KEYS.upload,
};

function mapStatusToMessageKey(status: number): ErrorMessageKey {
  const mapped = STATUS_MESSAGE_KEYS[status];

  if (mapped !== undefined) {
    return mapped;
  }

  if (status >= SERVER_ERROR_FLOOR) {
    return ERROR_MESSAGE_KEYS.server;
  }

  return ERROR_MESSAGE_KEYS.generic;
}

/**
 * Translate any thrown value into the i18n {@link ErrorMessageKey} the UI
 * should show. Non-HttpErrors and unclassifiable transport errors fall back to
 * `generic`; network/timeout map to their own copy; HTTP statuses map to the
 * closest user-meaningful message.
 */
export function mapErrorToMessageKey(error: unknown): ErrorMessageKey {
  if (!isHttpError(error)) {
    return ERROR_MESSAGE_KEYS.generic;
  }

  if (error.kind === 'network') {
    return ERROR_MESSAGE_KEYS.network;
  }

  if (error.kind === 'timeout') {
    return ERROR_MESSAGE_KEYS.timeout;
  }

  if (error.status === null) {
    return ERROR_MESSAGE_KEYS.generic;
  }

  return mapStatusToMessageKey(error.status);
}
