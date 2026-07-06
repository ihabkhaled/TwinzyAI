/**
 * Structural contracts for Server-Sent-Events streaming. Satisfied by the
 * platform's reply and raw response objects (Fastify / Node today) without
 * importing any vendor type into core.
 */

/** The subset of the Node writable response the SSE writer needs. */
export interface RawResponseLike {
  writeHead(statusCode: number, headers: Record<string, string>): void;
  write(chunk: string): boolean;
  end(): void;
  readonly writableEnded: boolean;
  on(event: 'close', listener: () => void): unknown;
}

/**
 * A reply that can be detached from the framework's own response handling so
 * we own the raw stream. Fastify's reply provides both `hijack()` and `raw`.
 */
export interface SseCapableReplyLike {
  hijack(): void;
  readonly raw: RawResponseLike;
}
