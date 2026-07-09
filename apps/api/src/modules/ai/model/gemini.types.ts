/**
 * Image payload for the image-capable AI calls. Post visual-similarity pivot
 * the photo goes to ALL THREE pipeline steps (extraction, candidate
 * generation, judging); it is encoded ONCE per request and reused.
 */
export interface AiImageInput {
  mimeType: string;
  base64Data: string;
}

/** The validated upload bytes an AiImageInput is built from (structural). */
export interface AiImageSource {
  readonly buffer: Buffer;
  readonly mimetype: string;
}

/** Result of one provider call, with metadata safe to log. */
export interface AiCallMetadata {
  provider: string;
  model: string;
  durationMs: number;
}

/** One attempt against a specific model; throws the raw provider error to classify. */
export type ModelCall = (model: string) => Promise<string>;
