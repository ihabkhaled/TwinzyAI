const FRAME_SEPARATOR = '\n\n';

const DATA_PREFIX = 'data:';

export interface SseFrameParser {
  /** Feeds a raw text chunk, returning the `data:` payloads of any frames it completed. */
  push(chunk: string): string[];
}

/**
 * Incremental Server-Sent-Events frame parser. Buffers partial input across
 * chunks and yields one string per completed frame's `data:` line, so a frame
 * split across two network reads is still parsed exactly once. Pure and
 * synchronous — no fetch, no timers — which keeps it trivially testable.
 */
export const createSseFrameParser = (): SseFrameParser => {
  let buffer = '';

  return {
    push(chunk: string): string[] {
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
    },
  };
};
