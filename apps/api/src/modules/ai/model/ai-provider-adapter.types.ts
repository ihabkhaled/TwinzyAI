import type { AiImageInput } from './gemini.types';

/**
 * Notified once per streamed chunk with the incremental text. Optional so
 * callers that only need the final assembled text can ignore progress.
 */
export type AiStreamChunkListener = (chunkText: string) => void;

/**
 * Optional content validator. Returning false means the model's returned text
 * is not acceptable (e.g., invalid JSON or schema mismatch), so the adapter
 * should try the next model in the configured chain before giving up.
 */
export type AiContentValidator = (text: string) => boolean;

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
  generateFromImage(
    prompt: string,
    image: AiImageInput,
    validate?: AiContentValidator,
  ): Promise<string>;
  generateFromText(prompt: string, validate?: AiContentValidator): Promise<string>;
  generateFromImageStream(
    prompt: string,
    image: AiImageInput,
    onChunk?: AiStreamChunkListener,
    signal?: AbortSignal,
    validate?: AiContentValidator,
  ): Promise<string>;
  generateFromTextStream(
    prompt: string,
    onChunk?: AiStreamChunkListener,
    signal?: AbortSignal,
    validate?: AiContentValidator,
  ): Promise<string>;
}

/** Injection token binding the port to the configured provider adapter. */
export const AI_PROVIDER_ADAPTER = Symbol('AI_PROVIDER_ADAPTER');
