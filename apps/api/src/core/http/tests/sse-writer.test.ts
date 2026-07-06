import { describe, expect, it, vi } from 'vitest';

import type { RawResponseLike } from '../sse.types';
import { SseWriter } from '../sse-writer';

interface RawStub extends RawResponseLike {
  chunks: string[];
  headers: Record<string, string> | undefined;
  statusCode: number | undefined;
  closeListener: (() => void) | undefined;
  writableEnded: boolean;
}

const buildRawStub = (): RawStub => {
  const stub: RawStub = {
    chunks: [],
    headers: undefined,
    statusCode: undefined,
    closeListener: undefined,
    writableEnded: false,
    writeHead(statusCode, headers): void {
      stub.statusCode = statusCode;
      stub.headers = headers;
    },
    write(chunk): boolean {
      stub.chunks.push(chunk);
      return true;
    },
    end(): void {
      stub.writableEnded = true;
    },
    on(_event, listener): unknown {
      stub.closeListener = listener;
      return stub;
    },
  };
  return stub;
};

describe('SseWriter', () => {
  it('writes SSE headers with anti-buffering directives on construction', () => {
    const raw = buildRawStub();

    const writer = new SseWriter(raw);
    expect(writer).toBeInstanceOf(SseWriter);

    expect(raw.statusCode).toBe(200);
    expect(raw.headers?.['Content-Type']).toContain('text/event-stream');
    expect(raw.headers?.['Cache-Control']).toContain('no-transform');
    expect(raw.headers?.['X-Accel-Buffering']).toBe('no');
  });

  it('serializes an event as an event/data frame', () => {
    const raw = buildRawStub();
    const writer = new SseWriter(raw);

    writer.event('stage', { event: 'stage', stage: 'judging' });

    expect(raw.chunks).toContain('event: stage\ndata: {"event":"stage","stage":"judging"}\n\n');
  });

  it('writes heartbeats as SSE comment lines', () => {
    const raw = buildRawStub();
    const writer = new SseWriter(raw);

    writer.comment('keep-alive');

    expect(raw.chunks).toContain(': keep-alive\n\n');
  });

  it('never writes after close and ends the stream once', () => {
    const raw = buildRawStub();
    const writer = new SseWriter(raw);

    writer.close();
    writer.close();
    writer.event('result', { event: 'result' });

    expect(raw.writableEnded).toBe(true);
    expect(raw.chunks).toHaveLength(0);
  });

  it('does not write once the socket has already ended (client disconnect)', () => {
    const raw = buildRawStub();
    const writer = new SseWriter(raw);
    raw.writableEnded = true;

    writer.event('stage', { event: 'stage' });

    expect(raw.chunks).toHaveLength(0);
  });

  it('registers a close listener for client disconnect', () => {
    const raw = buildRawStub();
    const writer = new SseWriter(raw);
    const onClose = vi.fn();

    writer.onClose(onClose);
    raw.closeListener?.();

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
