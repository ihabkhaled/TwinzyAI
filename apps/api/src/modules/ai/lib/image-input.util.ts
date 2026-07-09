import type { AiImageInput, AiImageSource } from '../model/gemini.types';

/**
 * Encodes the validated upload into the provider image payload EXACTLY ONCE per
 * request — the base64 of a multi-MB photo is the request path's biggest
 * synchronous CPU cost, so the result is built by the use-case and reused across
 * all three model calls, never re-encoded per step.
 */
export const buildAiImageInput = (source: AiImageSource): AiImageInput => ({
  mimeType: source.mimetype,
  base64Data: source.buffer.toString('base64'),
});
