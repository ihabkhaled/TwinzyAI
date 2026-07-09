import type { ErrorStreamMessage, GameStreamMessage, StreamStatusValue } from '@twinzy/shared';
import { GameStreamEvent, StreamStatus } from '@twinzy/shared';

import { ErrorCode, toErrorBody } from '../../../core/errors';
import { StreamAbortReason } from '../../../core/streaming';
import {
  ANALYSIS_CANCELLED_MESSAGE,
  ANALYSIS_TIMEOUT_MESSAGE,
  DUPLICATE_REQUEST_MESSAGE,
  SERVER_BUSY_MESSAGE,
} from '../model/game.messages';

/** Sink the stream use-case pushes protocol messages into. */
export type GameStreamEmitter = (message: GameStreamMessage) => void;

/** Correlation + lifecycle stamp applied to every outbound SSE frame. */
export interface OutboundStreamStamp {
  readonly tabId: string;
  readonly requestId: string;
  readonly streamId?: string;
  readonly status: StreamStatusValue;
}

/** A terminal error frame plus the lifecycle status that produced it. */
export interface StreamTermination {
  readonly message: ErrorStreamMessage;
  readonly status: StreamStatusValue;
}

/** Lifecycle status for a non-terminal / success frame emitted by the pipeline. */
export const statusForStreamEvent = (event: GameStreamMessage['event']): StreamStatusValue =>
  event === GameStreamEvent.Result ? StreamStatus.Completed : StreamStatus.Active;

/** Applies the correlation + status stamp to a frame before it goes on the wire. */
export const stampStreamFrame = <TMessage extends GameStreamMessage>(
  message: TMessage,
  stamp: OutboundStreamStamp,
): TMessage => ({ ...message, ...stamp });

const errorFrame = (errorCode: string, message: string): ErrorStreamMessage => ({
  event: GameStreamEvent.Error,
  errorCode,
  message,
});

/** Overload rejection frame (over capacity and the queue is full). */
export const buildBusyStreamMessage = (): ErrorStreamMessage =>
  errorFrame(ErrorCode.ServerBusy, SERVER_BUSY_MESSAGE);

/** Rejection frame for a duplicate / replayed in-flight request id. */
export const buildDuplicateStreamMessage = (): ErrorStreamMessage =>
  errorFrame(ErrorCode.ServerBusy, DUPLICATE_REQUEST_MESSAGE);

/**
 * Maps any thrown value to a safe in-band `error` stream event, reusing the
 * same envelope mapper as the JSON exception filter so a streamed failure
 * carries the identical errorCode/message — never a stack or provider detail.
 */
export const toStreamErrorMessage = (error: unknown): ErrorStreamMessage => {
  const body = toErrorBody(error);
  return errorFrame(body.errorCode, body.message);
};

/**
 * Classifies how a streamed pipeline ended into the terminal frame + status to
 * emit, or null when nothing should be sent (the client already disconnected).
 * An external abort is authoritative over whatever the pipeline threw: a cancel
 * is Cancelled, a watchdog/TTL timeout is a Failed timeout, a disconnect stays
 * silent.
 */
export const resolveStreamTermination = (
  error: unknown,
  signal: AbortSignal,
): StreamTermination | null => {
  if (signal.aborted) {
    if (signal.reason === StreamAbortReason.Disconnect) {
      return null;
    }
    if (signal.reason === StreamAbortReason.Cancel) {
      return {
        message: errorFrame(ErrorCode.AnalysisCancelled, ANALYSIS_CANCELLED_MESSAGE),
        status: StreamStatus.Cancelled,
      };
    }
    return {
      message: errorFrame(ErrorCode.AiTimeout, ANALYSIS_TIMEOUT_MESSAGE),
      status: StreamStatus.Failed,
    };
  }
  return { message: toStreamErrorMessage(error), status: StreamStatus.Failed };
};
