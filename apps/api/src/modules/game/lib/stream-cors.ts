/**
 * CORS headers for a hijacked SSE response. Hijacking the reply to own the raw
 * socket bypasses the framework's CORS hook, so the streaming response would
 * otherwise arrive cross-origin without an Access-Control-Allow-Origin header
 * and the browser would block it ("Failed to fetch"). We echo the request
 * origin only when it is in the configured allowlist — matching the global
 * CORS policy exactly, never a blanket wildcard.
 */
export const buildStreamCorsHeaders = (
  origin: string | undefined,
  allowedOrigins: readonly string[],
): Record<string, string> => {
  if (origin === undefined || !allowedOrigins.includes(origin)) {
    return {};
  }
  return {
    'Access-Control-Allow-Origin': origin,
    Vary: 'Origin',
  };
};
