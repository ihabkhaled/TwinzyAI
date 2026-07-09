import type { GeminiStepValue } from '../../../config/gemini-step.constants';

import type { AiImageInput } from './gemini.types';

/**
 * Notified once per streamed chunk with the incremental text. Optional so
 * callers that only need the final assembled text can ignore progress.
 */
export type AiStreamChunkListener = (chunkText: string) => void;

/**
 * Outcome of a content validation. `ok: false` carries a bounded, privacy-safe
 * `reason` (field paths + issue codes only — never model values) so the adapter
 * can log WHY a model's output was rejected instead of failing silently.
 */
export interface AiValidationResult {
  readonly ok: boolean;
  readonly reason?: string;
}

/**
 * Optional content validator. An `ok: false` result means the model's returned
 * text is not acceptable (invalid JSON or schema mismatch), so the adapter tries
 * the next model in the configured chain before giving up, logging the reason.
 */
export type AiContentValidator = (text: string) => AiValidationResult;

/**
 * Per-call options shared by all provider methods. `step` selects the
 * env-configured model chain for that pipeline step (extraction, generation,
 * judge, translation); omitted → the global chain. Model ids themselves never
 * appear here — they come exclusively from configuration.
 */
export interface AiCallOptions {
  readonly validate?: AiContentValidator;
  readonly step?: GeminiStepValue;
}

/**
 * Streaming variant: adds chunk progress and caller-driven cancellation.
 * Both fields tolerate an explicit `undefined` so callers can pass through
 * their own optional params without conditional spreads
 * (exactOptionalPropertyTypes).
 */
export interface AiStreamOptions extends AiCallOptions {
  readonly onChunk?: AiStreamChunkListener | undefined;
  readonly signal?: AbortSignal | undefined;
}

/**
 * Port for AI providers. The separation of the image and text methods is the
 * AI-safety boundary in type form: only the *FromImage methods can carry an
 * image, and only the trait-extraction service is allowed to call them.
 * Text-only pipeline steps (candidates, judge) cannot leak an image by
 * construction.
 *
 * The *Stream variants consume the provider's response incrementally: the
 * underlying connection stays active and the call is bounded by an idle
 * (inter-chunk) timeout rather than a fixed total deadline, so a long-running
 * generation is never cut off while the model is still producing output. They
 * still return the fully assembled text so the caller validates the complete
 * JSON exactly as the non-streaming path does. An optional `signal` lets the
 * caller cancel an in-flight generation (client cancel, disconnect, watchdog)
 * so the provider call — and its slot — is released immediately.
 */
export interface AiProviderAdapter {
  generateFromImage(prompt: string, image: AiImageInput, options?: AiCallOptions): Promise<string>;
  generateFromText(prompt: string, options?: AiCallOptions): Promise<string>;
  generateFromImageStream(
    prompt: string,
    image: AiImageInput,
    options?: AiStreamOptions,
  ): Promise<string>;
  generateFromTextStream(prompt: string, options?: AiStreamOptions): Promise<string>;
}

/** Injection token binding the port to the configured provider adapter. */
export const AI_PROVIDER_ADAPTER = Symbol('AI_PROVIDER_ADAPTER');
