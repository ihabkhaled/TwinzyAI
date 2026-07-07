import type { RawResponseLike } from './sse.types';

/**
 * SSE response headers. `no-transform` + `X-Accel-Buffering: no` stop proxies
 * (nginx and friends) from buffering the stream, so each event reaches the
 * client immediately and the connection is never idle long enough to time out.
 */
const SSE_HEADERS: Record<string, string> = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  'X-Accel-Buffering': 'no',
};

const SSE_OK_STATUS = 200;

/**
 * Writes Server-Sent-Events to a raw HTTP response. One instance owns one
 * response: it writes the SSE headers on construction, serializes each event
 * as an `event:`/`data:` frame, and is idempotent about closing. Every write
 * is guarded so nothing is emitted after the socket ends (client disconnect).
 */
export class SseWriter {
  private open = true;

  /**
   * @param extraHeaders merged into the SSE headers — used to carry CORS
   * headers, which must be written here because hijacking the reply bypasses
   * the framework's own CORS hook.
   */
  public constructor(
    private readonly raw: RawResponseLike,
    extraHeaders: Record<string, string> = {},
  ) {
    raw.writeHead(SSE_OK_STATUS, { ...SSE_HEADERS, ...extraHeaders });
  }

  public event(eventName: string, data: unknown): void {
    if (!this.canWrite()) {
      return;
    }
    this.raw.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  /** SSE comment line — ignored by clients, used purely as a keep-alive ping. */
  public comment(text: string): void {
    if (!this.canWrite()) {
      return;
    }
    this.raw.write(`: ${text}\n\n`);
  }

  public onClose(listener: () => void): void {
    this.raw.on('close', listener);
  }

  public close(): void {
    if (!this.open) {
      return;
    }
    this.open = false;
    if (!this.raw.writableEnded) {
      this.raw.end();
    }
  }

  private canWrite(): boolean {
    return this.open && !this.raw.writableEnded;
  }
}
