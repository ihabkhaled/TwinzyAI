import { TRAIT_KEYS } from '@twinzy/shared';

import type { AiProviderAdapter } from '../../modules/ai/interfaces/ai-provider-adapter.interface';
import type { AiImageInput } from '../../modules/ai/types/gemini.types';

export interface RecordedImageCall {
  prompt: string;
  image: AiImageInput;
}

/**
 * Deterministic AI adapter for tests. Responses are queued per method;
 * every call is recorded so tests can assert the image never reaches the
 * text-only pipeline steps.
 */
export class FakeAiAdapter implements AiProviderAdapter {
  public readonly imageCalls: RecordedImageCall[] = [];

  public readonly textCalls: string[] = [];

  private readonly imageResponses: (string | Error)[] = [];

  private readonly textResponses: (string | Error)[] = [];

  public queueImageResponse(response: string | Error): void {
    this.imageResponses.push(response);
  }

  public queueTextResponse(response: string | Error): void {
    this.textResponses.push(response);
  }

  public generateFromImage(prompt: string, image: AiImageInput): Promise<string> {
    this.imageCalls.push({ prompt, image });
    return this.dequeue(this.imageResponses);
  }

  public generateFromText(prompt: string): Promise<string> {
    this.textCalls.push(prompt);
    return this.dequeue(this.textResponses);
  }

  private dequeue(queue: (string | Error)[]): Promise<string> {
    const next = queue.shift();
    if (next === undefined) {
      return Promise.reject(new Error('FakeAiAdapter: no response queued'));
    }
    if (next instanceof Error) {
      return Promise.reject(next);
    }
    return Promise.resolve(next);
  }
}

export const buildTraitsPayload = (): Record<string, string> =>
  Object.fromEntries(TRAIT_KEYS.map((key) => [key, `observed ${key}`]));

export const buildTraitExtractionJson = (): string =>
  JSON.stringify({
    traits: buildTraitsPayload(),
    safetyCheck: {
      containsIdentityClaim: false,
      containsCelebrityComparison: false,
      containsSensitiveInference: false,
      containsFaceRecognitionClaim: false,
      containsBiometricClaim: false,
    },
  });

export const buildCandidatePayload = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  name: 'Sample Star',
  publicCategory: 'actor',
  countryOrRegion: 'Global',
  styleVibeFitScore: 84,
  reason: 'Shares a similar public style impression from hair and jawline traits.',
  alignedTraits: ['hairColor', 'jawlineChinOverallStructure'],
  weakOrUncertainTraits: ['eyeColorEyeShape'],
  safetyCheck: {
    containsFaceRecognitionClaim: false,
    containsBiometricClaim: false,
    containsIdentityClaim: false,
    containsExactLookalikeClaim: false,
  },
  ...overrides,
});

export const buildCandidatesJson = (
  candidates: Record<string, unknown>[] = [buildCandidatePayload()],
): string => JSON.stringify({ candidates });

export const buildJudgedResultPayload = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  name: 'Sample Star',
  rank: 1,
  finalStyleVibeFitScore: 82,
  verdict: 'strong',
  reason: 'Consistent style impression across major written traits.',
  matchingTraits: ['hairColor'],
  weakOrUncertainTraits: [],
  shouldDisplay: true,
  ...overrides,
});

export const buildJudgeJson = (
  results: Record<string, unknown>[] = [buildJudgedResultPayload()],
): string =>
  JSON.stringify({
    results,
    fallbackMessage: '',
    disclaimer:
      'This is a playful style/vibe result based on written visible traits only. It is not face recognition, identity matching, or biometric comparison.',
  });
