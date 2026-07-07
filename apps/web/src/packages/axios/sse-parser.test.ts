import { describe, expect, it } from 'vitest';

import { createSseFrameParser } from './sse-parser';

describe('createSseFrameParser', () => {
  it('returns the data payload of a completed frame', () => {
    const parser = createSseFrameParser();

    expect(parser.push('data: hello\n\n')).toEqual(['hello']);
  });

  it('buffers a frame split across two chunks and parses it once', () => {
    const parser = createSseFrameParser();

    expect(parser.push('data: par')).toEqual([]);
    expect(parser.push('tial\n\n')).toEqual(['partial']);
  });

  it('parses multiple frames delivered in a single chunk', () => {
    const parser = createSseFrameParser();

    expect(parser.push('data: a\n\ndata: b\n\n')).toEqual(['a', 'b']);
  });

  it('ignores frames without a data line and skips non-data lines', () => {
    const parser = createSseFrameParser();

    expect(parser.push('event: ping\n\n')).toEqual([]);
    expect(parser.push(': comment\ndata: kept\n\n')).toEqual(['kept']);
  });

  it('holds a trailing partial frame until its separator arrives', () => {
    const parser = createSseFrameParser();

    expect(parser.push('data: first\n\ndata: second')).toEqual(['first']);
    expect(parser.push('\n\n')).toEqual(['second']);
  });
});
