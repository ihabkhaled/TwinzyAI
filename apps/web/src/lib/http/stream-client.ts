import { isRecord } from '@twinzy/shared';

import { getApiBaseUrl } from '../config/public-env';

import { HttpClientError, INVALID_RESPONSE_CODE, NETWORK_ERROR_CODE } from './http-error';
import { createSseFrameParser } from './sse-parser';

const EVENT_STREAM_CONTENT_TYPE = 'text/event-stream';

/** Notified with each SSE frame's raw `data:` payload as it arrives. */
export type SseDataListener = (data: string) => void;

/**
 * The only file in the web app allowed to open a streaming fetch. POSTs the
 * multipart body and reads the Server-Sent-Events response frame by frame,
 * forwarding each `data:` payload as it arrives. There is deliberately NO
 * client-side timeout: the reader waits on the open connection for as long as
 * the server keeps it alive (heartbeats + progress events), so a long Gemini
 * pipeline never times out. A non-stream response (transport-level rejection)
 * is surfaced as a typed HttpClientError before any frame is read.
 */
export const postMultipartStream = async (
  path: string,
  formData: FormData,
  onData: SseDataListener,
): Promise<void> => {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, { method: 'POST', body: formData });
  } catch {
    throw new HttpClientError(0, NETWORK_ERROR_CODE, 'Network request failed');
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!response.ok || !contentType.includes(EVENT_STREAM_CONTENT_TYPE)) {
    throw await toStreamError(response);
  }

  if (response.body === null) {
    throw new HttpClientError(response.status, INVALID_RESPONSE_CODE, 'Missing response stream');
  }

  await readStream(response.body, onData);
};

const readStream = async (
  stream: ReadableStream<Uint8Array>,
  onData: SseDataListener,
): Promise<void> => {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const parser = createSseFrameParser();

  // Recursive pump instead of a while+await loop: each await suspends rather
  // than growing the call stack, so there is no unbounded recursion and no
  // await-in-loop. Reads run strictly in order, one stream chunk at a time.
  const pump = async (): Promise<void> => {
    const chunk = await reader.read();
    if (chunk.value !== undefined) {
      for (const data of parser.push(decoder.decode(chunk.value, { stream: true }))) {
        onData(data);
      }
    }
    if (!chunk.done) {
      await pump();
    }
  };

  await pump();
};

const toStreamError = async (response: Response): Promise<HttpClientError> => {
  const payload: unknown = await response.json().catch(() => null);
  if (isRecord(payload) && typeof payload['errorCode'] === 'string') {
    const message = typeof payload['message'] === 'string' ? payload['message'] : '';
    return new HttpClientError(response.status, payload['errorCode'], message);
  }
  return new HttpClientError(response.status, INVALID_RESPONSE_CODE, 'Unexpected error response');
};
