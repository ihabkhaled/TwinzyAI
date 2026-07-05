/** Image payload for the single image-capable AI call (trait extraction). */
export interface AiImageInput {
  mimeType: string;
  base64Data: string;
}

/** Result of one provider call, with metadata safe to log. */
export interface AiCallMetadata {
  provider: string;
  model: string;
  durationMs: number;
}
