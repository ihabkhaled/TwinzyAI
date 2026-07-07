import { z } from 'zod';

import { MAX_CANDIDATES } from '../constants/trait.constants';
import {
  MAX_COMPACT_TRAIT_SUMMARY,
  MAX_TRAIT_COUNT,
  MAX_TRAIT_TEXT_LENGTH,
} from '../constants/trait-category.constants';
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
    .max(MAX_COMPACT_TRAIT_SUMMARY),
});

/**
 * Intermediate progress payload: the public-figure candidate names being
 * considered, streamed after generation as "rough examples". Names only, and
 * only candidates that already passed the safety-constrained generation.
 */
export const CandidatesStreamMessageSchema = z.object({
  event: z.literal(GameStreamEvent.Candidates),
  names: z.array(z.string().trim().min(1).max(120)).max(MAX_CANDIDATES),
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
