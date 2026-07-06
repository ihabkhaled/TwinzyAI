import { describe, expect, it } from 'vitest';

import { createSseFrameParser } from '@/lib/http/sse-parser';

describe('createSseFrameParser', () => {
  it('extracts the data payload from a complete frame', () => {
    const parser = createSseFrameParser();

    expect(parser.push('event: stage\ndata: {"event":"stage"}\n\n')).toEqual(['{"event":"stage"}']);
  });

  it('reassembles a frame split across two chunks', () => {
    const parser = createSseFrameParser();

    expect(parser.push('event: result\ndata: {"eve')).toEqual([]);
    expect(parser.push('nt":"result"}\n\n')).toEqual(['{"event":"result"}']);
  });

  it('returns multiple payloads when several frames arrive together', () => {
    const parser = createSseFrameParser();

    const payloads = parser.push('data: {"event":"accepted"}\n\ndata: {"event":"stage"}\n\n');

    expect(payloads).toEqual(['{"event":"accepted"}', '{"event":"stage"}']);
  });

  it('ignores comment-only (heartbeat) frames', () => {
    const parser = createSseFrameParser();

    expect(parser.push(': keep-alive\n\n')).toEqual([]);
  });

  it('buffers an incomplete trailing frame until it is terminated', () => {
    const parser = createSseFrameParser();

    expect(parser.push('data: {"event":"stage"}\n\ndata: {"event":"res')).toEqual([
      '{"event":"stage"}',
    ]);
    expect(parser.push('ult"}\n\n')).toEqual(['{"event":"result"}']);
  });
});
