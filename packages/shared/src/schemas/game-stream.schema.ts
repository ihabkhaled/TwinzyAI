import { z } from 'zod';

import { MAX_NAME_LENGTH } from '../constants/response-bounds.constants';
import { MAX_CANDIDATE_POOL, MAX_RESULT_COUNT } from '../constants/trait.constants';
import {
  MAX_COMPACT_TRAIT_SUMMARY,
  MAX_TRAIT_COUNT,
  MAX_TRAIT_TEXT_LENGTH,
} from '../constants/trait-category.constants';
import { GAME_STREAM_STAGE_VALUES, GameStreamEvent } from '../enums/game-stream.enum';
import { STREAM_STATUS_VALUES } from '../enums/stream-status.enum';

import { FinalGameResultSchema } from './game-result.schema';

/**
 * SSE message contract for the streaming analyze endpoint. Both sides validate
 * against these schemas, so a drifting event shape fails fast rather than
 * silently mis-rendering. A discriminated union on `event` keeps each payload
 * exact.
 *
 * Every frame also carries an optional correlation envelope (`tabId`,
 * `requestId`, `streamId`, `status`) so a client with several concurrent
 * tabs/requests can attribute — and filter — each frame to the run that
 * produced it. The fields are optional purely for backward compatibility: the
 * server always stamps them, and a frame without them is treated as
 * "unattributed" (accepted, but not matchable to a specific run).
 */

/**
 * The canonical correlation-id shape (an RFC uuid). Both sides validate against
 * this exact schema — the server when it echoes a client-supplied id and the
 * client when it parses a frame — so the server's acceptance can never be looser
 * than the client's validation (which would silently drop the run's frames).
 */
export const CorrelationIdSchema = z.uuid();

/**
 * The per-frame correlation envelope. `tabId`/`requestId` originate on the
 * client and ride in on request headers; `streamId` is minted server-side per
 * connection; `status` is the lifecycle marker (see `StreamStatus`).
 */
export const streamEnvelopeShape = {
  tabId: CorrelationIdSchema.optional(),
  requestId: CorrelationIdSchema.optional(),
  streamId: CorrelationIdSchema.optional(),
  status: z.enum(STREAM_STATUS_VALUES).optional(),
} as const;

export const StreamEnvelopeSchema = z.object(streamEnvelopeShape);

export type StreamEnvelope = z.infer<typeof StreamEnvelopeSchema>;

export const StageStreamMessageSchema = z.object({
  event: z.literal(GameStreamEvent.Stage),
  stage: z.enum(GAME_STREAM_STAGE_VALUES),
  ...streamEnvelopeShape,
});

export const AcceptedStreamMessageSchema = z.object({
  event: z.literal(GameStreamEvent.Accepted),
  ...streamEnvelopeShape,
});

/**
 * Intermediate progress payload: the trait count plus the compact summary of
 * the strongest extracted signals, streamed right after extraction so the UI
 * can "write them down" live. Lean by design (the full nested taxonomy comes
 * with the final result) and text only — never the image.
 */
export const TraitsStreamMessageSchema = z.object({
  event: z.literal(GameStreamEvent.Traits),
  traitCount: z.number().int().min(0).max(MAX_TRAIT_COUNT),
  compactTraitSummary: z
    .array(z.string().trim().min(1).max(MAX_TRAIT_TEXT_LENGTH))
    .min(1)
    .max(MAX_COMPACT_TRAIT_SUMMARY),
  ...streamEnvelopeShape,
});

/**
 * Intermediate progress payload: the public-figure candidate names being
 * considered, streamed after generation as "rough examples". Names only, and
 * only candidates that already passed the safety-constrained generation.
 */
export const CandidatesStreamMessageSchema = z.object({
  event: z.literal(GameStreamEvent.Candidates),
  resultCount: z.number().int().min(1).max(MAX_RESULT_COUNT),
  names: z.array(z.string().trim().min(1).max(MAX_NAME_LENGTH)).max(MAX_CANDIDATE_POOL),
  ...streamEnvelopeShape,
});

export const ResultStreamMessageSchema = z.object({
  event: z.literal(GameStreamEvent.Result),
  result: FinalGameResultSchema,
  ...streamEnvelopeShape,
});

export const ErrorStreamMessageSchema = z.object({
  event: z.literal(GameStreamEvent.Error),
  errorCode: z.string().min(1),
  message: z.string(),
  ...streamEnvelopeShape,
});

export const HeartbeatStreamMessageSchema = z.object({
  event: z.literal(GameStreamEvent.Heartbeat),
  ...streamEnvelopeShape,
});

export const GameStreamMessageSchema = z.discriminatedUnion('event', [
  AcceptedStreamMessageSchema,
  StageStreamMessageSchema,
  TraitsStreamMessageSchema,
  CandidatesStreamMessageSchema,
  ResultStreamMessageSchema,
  ErrorStreamMessageSchema,
  HeartbeatStreamMessageSchema,
]);

export type StageStreamMessage = z.infer<typeof StageStreamMessageSchema>;
export type TraitsStreamMessage = z.infer<typeof TraitsStreamMessageSchema>;
export type CandidatesStreamMessage = z.infer<typeof CandidatesStreamMessageSchema>;
export type ResultStreamMessage = z.infer<typeof ResultStreamMessageSchema>;
export type ErrorStreamMessage = z.infer<typeof ErrorStreamMessageSchema>;
export type GameStreamMessage = z.infer<typeof GameStreamMessageSchema>;

/**
 * Body of `POST /api/v1/game/cancel`. All three ids are required and must match
 * an in-flight stream for the cancel to take effect — a mismatch is a silent
 * no-op so one tab can never cancel another tab's (or another user's) run.
 */
export const CancelAnalysisRequestSchema = z.strictObject({
  tabId: CorrelationIdSchema,
  requestId: CorrelationIdSchema,
  streamId: CorrelationIdSchema,
});

export type CancelAnalysisRequest = z.infer<typeof CancelAnalysisRequestSchema>;

/** Response of the cancel endpoint: whether a matching stream was aborted. */
export const CancelAnalysisResponseSchema = z.strictObject({
  cancelled: z.boolean(),
});

export type CancelAnalysisResponse = z.infer<typeof CancelAnalysisResponseSchema>;
