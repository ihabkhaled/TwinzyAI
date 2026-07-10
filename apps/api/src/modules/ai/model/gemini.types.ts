/**
 * Image payload for trait extraction, the only image-capable pipeline step.
 * Text-only generation/judging contracts cannot accept this type.
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

/** One attempt against a specific model; throws the raw provider error to classify. */
export type ModelCall = (model: string) => Promise<string>;
