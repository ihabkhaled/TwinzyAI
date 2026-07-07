/**
 * Canonical HTTP header names that carry the per-tab / per-request correlation
 * identifiers into the streaming-analyze and cancel endpoints. Kept lowercase
 * and namespaced (`x-twinzy-*`) because Fastify/HTTP-2 lowercase header keys and
 * the namespace avoids collision with proxy- or logger-injected headers such as
 * `x-request-id`. Both sides read these exact names, so the correlation
 * contract cannot drift.
 */
export const STREAM_ID_HEADERS = {
  tabId: 'x-twinzy-tab-id',
  requestId: 'x-twinzy-request-id',
  streamId: 'x-twinzy-stream-id',
} as const;

export type StreamIdHeaderKey = keyof typeof STREAM_ID_HEADERS;

export type StreamIdHeaderName = (typeof STREAM_ID_HEADERS)[StreamIdHeaderKey];
