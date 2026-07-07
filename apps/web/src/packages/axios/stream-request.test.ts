import { afterEach, describe, expect, it, vi } from 'vitest';

import type { HttpError } from './http-error';
import { isHttpError } from './http-error';
import { streamMultipart } from './stream-request';

const encoder = new TextEncoder();

const ignore = (): void => undefined;

const eventStreamResponse = (body: string): Response =>
  new Response(
    new ReadableStream<Uint8Array>({
      start(controller): void {
        controller.enqueue(encoder.encode(body));
        controller.close();
      },
    }),
    { status: 200, headers: { 'content-type': 'text/event-stream' } },
  );

const capture = async (call: () => Promise<void>): Promise<unknown> => {
  try {
    await call();
  } catch (error) {
    return error;
  }
  return undefined;
};

describe('streamMultipart', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('forwards each SSE data payload from the open stream in order', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(eventStreamResponse('data: one\n\ndata: two\n\n')),
    );
    const payloads: string[] = [];

    await streamMultipart('/stream', new FormData(), (data) => {
      payloads.push(data);
    });

    expect(payloads).toEqual(['one', 'two']);
  });

  it('throws a network HttpError when the fetch itself rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const error = await capture(() => streamMultipart('/stream', new FormData(), ignore));

    expect(isHttpError(error)).toBe(true);
    expect((error as HttpError).kind).toBe('network');
  });

  it('throws an http HttpError preserving the backend errorCode for a non-stream response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json(
          { errorCode: 'RATE_LIMITED', message: 'slow down' },
          {
            status: 429,
            headers: { 'content-type': 'application/json' },
          },
        ),
      ),
    );

    const error = await capture(() => streamMultipart('/stream', new FormData(), ignore));

    expect(isHttpError(error)).toBe(true);
    const httpError = error as HttpError;
    expect(httpError.kind).toBe('http');
    expect(httpError.status).toBe(429);
    expect(httpError.responseBody).toStrictEqual({
      errorCode: 'RATE_LIMITED',
      message: 'slow down',
    });
  });
});
