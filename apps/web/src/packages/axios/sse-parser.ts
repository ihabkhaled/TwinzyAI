const FRAME_SEPARATOR = '\n\n';

const DATA_PREFIX = 'data:';

/** Feeds raw text chunks and returns the `data:` payloads of completed frames. */
export interface SseFrameParser {
  push(chunk: string): string[];
}

/**
 * Incremental Server-Sent-Events frame parser. Buffers partial input across
 * chunks and yields one string per completed frame's `data:` line, so a frame
 * split across two network reads is still parsed exactly once. Pure and
 * synchronous — no fetch, no timers — which keeps it trivially testable.
 */
export function createSseFrameParser(): SseFrameParser {
  let buffer = '';

  const push = (chunk: string): string[] => {
    buffer += chunk;
    const payloads: string[] = [];

    let separatorIndex = buffer.indexOf(FRAME_SEPARATOR);
    while (separatorIndex !== -1) {
      const frame = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + FRAME_SEPARATOR.length);

      const dataLine = frame.split('\n').find((line) => line.startsWith(DATA_PREFIX));
      if (dataLine !== undefined) {
        payloads.push(dataLine.slice(DATA_PREFIX.length).trim());
      }

      separatorIndex = buffer.indexOf(FRAME_SEPARATOR);
    }

    return payloads;
  };

  return { push };
}
