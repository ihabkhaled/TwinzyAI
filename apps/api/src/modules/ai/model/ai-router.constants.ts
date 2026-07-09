import { ErrorCode, type ErrorCodeValue } from '../../../core/errors';

/**
 * Error codes after which the router may advance to the NEXT route entry —
 * transient provider trouble or content the schema rejected, where a different
 * provider/model can genuinely succeed. Everything else (cancellations,
 * unexpected bugs) propagates immediately.
 */
export const ROUTE_HOPPABLE_ERROR_CODES = [
  ErrorCode.AiRateLimited,
  ErrorCode.AiProviderUnavailable,
  ErrorCode.AiTimeout,
  ErrorCode.AiResponseInvalid,
] as const satisfies readonly ErrorCodeValue[];

/** Sampling resolution for the 0..1 shadow rate (integer randomness domain). */
export const SHADOW_SAMPLE_RESOLUTION = 1_000_000;
