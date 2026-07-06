import type { ErrorStreamMessage, GameStreamMessage } from '@twinzy/shared';
import { GameStreamEvent } from '@twinzy/shared';

import { toErrorBody } from '../../../core/errors';

/** Sink the stream use-case pushes protocol messages into. */
export type GameStreamEmitter = (message: GameStreamMessage) => void;

/**
 * Maps any thrown value to a safe in-band `error` stream event, reusing the
 * same envelope mapper as the JSON exception filter so a streamed failure
 * carries the identical errorCode/message — never a stack or provider detail.
 */
export const toStreamErrorMessage = (error: unknown): ErrorStreamMessage => {
  const body = toErrorBody(error);
  return {
    event: GameStreamEvent.Error,
    errorCode: body.errorCode,
    message: body.message,
  };
};

/** Interval between keep-alive heartbeats while the pipeline runs. */
export const STREAM_HEARTBEAT_INTERVAL_MS = 10_000;
