/**
 * How a raw provider (Gemini) error should be treated when a model chain is
 * available. RateLimited and Unavailable are worth retrying on the NEXT model;
 * Fatal is not (the request itself is bad or the provider is fully down).
 * Timeouts are handled separately by the adapter (our own idle abort), so this
 * classifier never sees them.
 */
export const ProviderErrorKind = {
  RateLimited: 'rate-limited',
  Unavailable: 'unavailable',
  Fatal: 'fatal',
} as const;

export type ProviderErrorKindValue = (typeof ProviderErrorKind)[keyof typeof ProviderErrorKind];

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

  if (status === 429 || RATE_LIMIT_PATTERN.test(message)) {
    return ProviderErrorKind.RateLimited;
  }

  if (status === 500 || status === 503 || status === 404 || UNAVAILABLE_PATTERN.test(message)) {
    return ProviderErrorKind.Unavailable;
  }

  return ProviderErrorKind.Fatal;
};

/** True when it is worth retrying the same call on the next model in the chain. */
export const isModelRetryable = (kind: ProviderErrorKindValue): boolean =>
  kind === ProviderErrorKind.RateLimited || kind === ProviderErrorKind.Unavailable;
