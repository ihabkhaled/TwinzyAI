import {
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_SERVICE_UNAVAILABLE,
  HTTP_STATUS_TOO_MANY_REQUESTS,
} from '@twinzy/shared';

import { ProviderErrorKind, type ProviderErrorKindValue } from '../model/provider-error.enums';

export { ProviderErrorKind, type ProviderErrorKindValue } from '../model/provider-error.enums';

const RATE_LIMIT_PATTERN = /\b429\b|resource_exhausted|quota|rate.?limit/i;

const UNAVAILABLE_PATTERN =
  /\b(?:500|503)\b|overloaded|unavailable|not found|not supported|internal error/i;

/** Extracts an HTTP-ish status from the many shapes provider SDKs throw. */
const readStatus = (error: unknown): number | undefined => {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }
  const candidate = error as { status?: unknown; code?: unknown };
  if (typeof candidate.status === 'number') {
    return candidate.status;
  }
  if (typeof candidate.code === 'number') {
    return candidate.code;
  }
  const match = /"code"\s*:\s*(\d+)/.exec(messageOf(error));
  return match?.[1] === undefined ? undefined : Number(match[1]);
};

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const classifyProviderError = (error: unknown): ProviderErrorKindValue => {
  const status = readStatus(error);
  const message = messageOf(error);

  if (status === HTTP_STATUS_TOO_MANY_REQUESTS || RATE_LIMIT_PATTERN.test(message)) {
    return ProviderErrorKind.RateLimited;
  }

  if (
    status === HTTP_STATUS_INTERNAL_SERVER_ERROR ||
    status === HTTP_STATUS_SERVICE_UNAVAILABLE ||
    status === HTTP_STATUS_NOT_FOUND ||
    UNAVAILABLE_PATTERN.test(message)
  ) {
    return ProviderErrorKind.Unavailable;
  }

  return ProviderErrorKind.Fatal;
};

/** True when it is worth retrying the same call on the next model in the chain. */
export const isModelRetryable = (kind: ProviderErrorKindValue): boolean =>
  kind === ProviderErrorKind.RateLimited || kind === ProviderErrorKind.Unavailable;
