import { isRecord } from '@twinzy/shared';

import { publicEnv } from '@/packages/env';

import { HttpError } from './http-error';
import { createSseFrameParser } from './sse-parser';

const EVENT_STREAM_CONTENT_TYPE = 'text/event-stream';

/** Notified with each SSE frame's raw `data:` payload as it arrives. */
export type SseDataListener = (data: string) => void;

/**
 * Per-request controls for a streaming POST: an `AbortSignal` to cancel the
 * open connection (aborting the fetch closes the socket, which the server
 * treats as a disconnect and stops the pipeline) and extra request `headers`
 * (never `content-type` — the multipart boundary must stay auto-generated).
 */
export interface StreamRequestOptions {
  readonly signal?: AbortSignal;
  readonly headers?: Record<string, string>;
}

/**
 * The one place in the app allowed to open a streaming `fetch`. POSTs the
 * multipart body and reads the Server-Sent-Events response frame by frame,
 * forwarding each `data:` payload as it arrives. There is deliberately NO
 * client-side timeout: the reader waits on the open connection for as long as
 * the server keeps it alive (heartbeats + progress events), so a long AI
 * pipeline never times out. Transport failures and non-stream responses are
 * surfaced as the shared {@link HttpError} before any frame is read; an error
 * response body that carries a backend `errorCode` is preserved on
 * `responseBody` so callers can map it to a friendly message.
 */
export async function streamMultipart(
  path: string,
  formData: FormData,
  onData: SseDataListener,
  options?: StreamRequestOptions,
): Promise<void> {
  const response = await openStream(path, formData, options);

  const contentType = response.headers.get('content-type') ?? '';
  if (!response.ok || !contentType.includes(EVENT_STREAM_CONTENT_TYPE)) {
    throw await toStreamHttpError(response);
  }

  if (response.body === null) {
    throw new HttpError('http', 'Missing response stream', response.status, null);
  }

  await readStream(response.body, onData);
}

async function openStream(
  path: string,
  formData: FormData,
  options?: StreamRequestOptions,
): Promise<Response> {
  try {
    return await fetch(`${publicEnv.apiBaseUrl}${path}`, {
      method: 'POST',
      body: formData,
      ...(options?.signal === undefined ? {} : { signal: options.signal }),
      ...(options?.headers === undefined ? {} : { headers: options.headers }),
    });
  } catch {
    throw new HttpError('network', 'Streaming request failed', null, null);
  }
}

async function readStream(
  stream: ReadableStream<Uint8Array>,
  onData: SseDataListener,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const parser = createSseFrameParser();

  // Recursive pump instead of a while+await loop: each await suspends rather
  // than growing the call stack, so there is no await-in-loop and reads run
  // strictly in order, one stream chunk at a time.
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
}

async function toStreamHttpError(response: Response): Promise<HttpError> {
  const payload: unknown = await response.json().catch(() => null);
  if (isRecord(payload) && typeof payload['errorCode'] === 'string') {
    const message = typeof payload['message'] === 'string' ? payload['message'] : 'Request failed';
    return new HttpError('http', message, response.status, payload);
  }
  return new HttpError('http', 'Unexpected error response', response.status, payload);
}
