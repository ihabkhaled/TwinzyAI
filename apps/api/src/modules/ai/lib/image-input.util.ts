import type { AiImageInput, AiImageSource } from '../model/gemini.types';

/**
 * Encodes a validated upload for the single image-capable extraction call.
 * The result never crosses into candidate generation or judging.
 */
export const buildAiImageInput = (source: AiImageSource): AiImageInput => ({
  mimeType: source.mimetype,
  base64Data: source.buffer.toString('base64'),
});
