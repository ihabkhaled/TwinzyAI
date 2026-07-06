import type { AiImageInput } from './gemini.types';

/**
 * Port for AI providers. The separation of the two methods is the AI-safety
 * boundary in type form: only generateFromImage can carry an image, and only
 * the trait-extraction service is allowed to call it. Text-only pipeline
 * steps (candidates, judge) cannot leak an image by construction.
 */
export interface AiProviderAdapter {
  generateFromImage(prompt: string, image: AiImageInput): Promise<string>;
  generateFromText(prompt: string): Promise<string>;
}

/** Injection token binding the port to the configured provider adapter. */
export const AI_PROVIDER_ADAPTER = Symbol('AI_PROVIDER_ADAPTER');
