import { z } from 'zod';

import { GAME_STREAM_STAGE_VALUES, GameStreamEvent } from '../enums/game-stream.enum';

import { FinalGameResultSchema } from './game-result.schema';

/**
 * SSE message contract for the streaming analyze endpoint. Both sides validate
 * against these schemas, so a drifting event shape fails fast rather than
 * silently mis-rendering. A discriminated union on `event` keeps each payload
 * exact.
 */

export const StageStreamMessageSchema = z.object({
  event: z.literal(GameStreamEvent.Stage),
  stage: z.enum(GAME_STREAM_STAGE_VALUES),
});

export const AcceptedStreamMessageSchema = z.object({
  event: z.literal(GameStreamEvent.Accepted),
});

export const ResultStreamMessageSchema = z.object({
  event: z.literal(GameStreamEvent.Result),
  result: FinalGameResultSchema,
});

export const ErrorStreamMessageSchema = z.object({
  event: z.literal(GameStreamEvent.Error),
  errorCode: z.string().min(1),
  message: z.string(),
});

export const HeartbeatStreamMessageSchema = z.object({
  event: z.literal(GameStreamEvent.Heartbeat),
});

export const GameStreamMessageSchema = z.discriminatedUnion('event', [
  AcceptedStreamMessageSchema,
  StageStreamMessageSchema,
  ResultStreamMessageSchema,
  ErrorStreamMessageSchema,
  HeartbeatStreamMessageSchema,
]);

export type StageStreamMessage = z.infer<typeof StageStreamMessageSchema>;
export type ResultStreamMessage = z.infer<typeof ResultStreamMessageSchema>;
export type ErrorStreamMessage = z.infer<typeof ErrorStreamMessageSchema>;
export type GameStreamMessage = z.infer<typeof GameStreamMessageSchema>;
