/**
 * How a raw provider error should be treated when a model chain is available.
 * RateLimited and Unavailable are worth retrying on the NEXT model; Fatal is
 * not (the request itself is bad or the provider is fully down). Timeouts are
 * handled separately by the adapters (their own idle abort), so the classifier
 * never sees them.
 */
export const ProviderErrorKind = {
  RateLimited: 'rate-limited',
  Unavailable: 'unavailable',
  Fatal: 'fatal',
} as const;

export type ProviderErrorKindValue = (typeof ProviderErrorKind)[keyof typeof ProviderErrorKind];
