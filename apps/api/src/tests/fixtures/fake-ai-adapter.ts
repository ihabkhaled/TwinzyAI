import type { TraitExtractionResponse } from '@twinzy/shared';
import {
  GAME_PROMPT_VERSION,
  RESULT_DISCLAIMER,
  TOTAL_TRAIT_FIELDS,
  TRAIT_CATEGORY_FIELDS,
  UNCERTAINTY_NOTE_FIELDS,
} from '@twinzy/shared';

import type {
  AiProviderAdapter,
  AiStreamChunkListener,
} from '../../modules/ai/model/ai-provider-adapter.types';
import type { AiImageInput } from '../../modules/ai/model/gemini.types';

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

  public async generateFromImageStream(
    prompt: string,
    image: AiImageInput,
    onChunk?: AiStreamChunkListener,
    signal?: AbortSignal,
  ): Promise<string> {
    this.imageCalls.push({ prompt, image });
    signal?.throwIfAborted();
    return this.streamDequeue(this.imageResponses, onChunk);
  }

  public async generateFromTextStream(
    prompt: string,
    onChunk?: AiStreamChunkListener,
    signal?: AbortSignal,
  ): Promise<string> {
    this.textCalls.push(prompt);
    signal?.throwIfAborted();
    return this.streamDequeue(this.textResponses, onChunk);
  }

  /** Delivers the queued response as a single chunk so onChunk fires once. */
  private async streamDequeue(
    queue: (string | Error)[],
    onChunk?: AiStreamChunkListener,
  ): Promise<string> {
    const text = await this.dequeue(queue);
    onChunk?.(text);
    return text;
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

/** Full nested advanced traits: every field of every category filled. */
export const buildTraitsPayload = (): Record<string, unknown> => ({
  ...Object.fromEntries(
    Object.entries(TRAIT_CATEGORY_FIELDS).map(([category, fields]) => [
      category,
      Object.fromEntries(fields.map((field) => [field, `observed ${field}`])),
    ]),
  ),
  uncertaintyNotes: Object.fromEntries(UNCERTAINTY_NOTE_FIELDS.map((field) => [field, []])),
});

export const buildSafetyCheckPayload = (): Record<string, boolean> => ({
  containsIdentityClaim: false,
  containsCelebrityComparison: false,
  containsSensitiveInference: false,
  containsFaceRecognitionClaim: false,
  containsBiometricClaim: false,
});

/** Full valid Prompt 1 response (advanced-global-traits-v2). */
export const buildTraitExtractionPayload = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  promptVersion: GAME_PROMPT_VERSION,
  languageCode: 'en',
  traitCount: TOTAL_TRAIT_FIELDS,
  traits: buildTraitsPayload(),
  compactTraitSummary: ['clear oval face', 'wavy dark hair'],
  safetyCheck: buildSafetyCheckPayload(),
  ...overrides,
});

export const buildTraitExtractionJson = (
  overrides: Partial<Record<string, unknown>> = {},
): string => JSON.stringify(buildTraitExtractionPayload(overrides));

/** Typed extraction fixture for direct service/unit inputs. */
export const buildTraitExtraction = (): TraitExtractionResponse =>
  buildTraitExtractionPayload() as unknown as TraitExtractionResponse;

export const buildCandidatePayload = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  name: 'Sample Star',
  publicCategory: 'actor',
  countryOrRegion: 'Global',
  globalPopularityLevel: 'high',
  styleVibeFitScore: 84,
  confidenceLevel: 'high',
  reason: 'Shares a similar public style impression from hair and jawline traits.',
  strongAlignedTraits: ['wavy dark hair'],
  mediumAlignedTraits: ['defined jawline'],
  weakOrUncertainTraits: ['eye color unclear'],
  majorMismatchRisks: [],
  whyThisCandidateWasChosen: 'Strong overlap across hair, jawline, and grooming style signals.',
  scoreExplanation: 'Most major visible traits align; a few remain unclear.',
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
): string =>
  JSON.stringify({
    promptVersion: GAME_PROMPT_VERSION,
    languageCode: 'en',
    candidateCount: candidates.length,
    candidates,
    fallbackMessage: '',
  });

export const buildJudgedResultPayload = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  name: 'Sample Star',
  rank: 1,
  finalStyleVibeFitScore: 82,
  confidenceLevel: 'high',
  verdict: 'strong',
  countryOrRegion: 'Global',
  publicCategory: 'actor',
  finalReason: 'Consistent style impression across major written traits.',
  topMatchingTraits: ['wavy dark hair'],
  secondaryMatchingTraits: ['defined jawline'],
  weakOrUncertainTraits: [],
  mismatchWarnings: [],
  judgeNotes: 'Score kept conservative because several traits were unclear.',
  shouldDisplay: true,
  ...overrides,
});

export const buildJudgeJson = (
  results: Record<string, unknown>[] = [buildJudgedResultPayload()],
): string =>
  JSON.stringify({
    promptVersion: GAME_PROMPT_VERSION,
    languageCode: 'en',
    results,
    removedCandidates: [],
    fallbackMessage: '',
    disclaimer: RESULT_DISCLAIMER,
  });

/** Full valid FinalGameResult payload (for the translate endpoint tests). */
export const buildFinalGameResultPayload = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  promptVersion: GAME_PROMPT_VERSION,
  languageCode: 'en',
  traitCount: TOTAL_TRAIT_FIELDS,
  traits: buildTraitsPayload(),
  compactTraitSummary: ['clear oval face', 'wavy dark hair'],
  results: [
    {
      name: 'Sample Star',
      rank: 1,
      finalStyleVibeFitScore: 82,
      confidenceLevel: 'high',
      verdict: 'strong',
      countryOrRegion: 'Global',
      publicCategory: 'actor',
      finalReason: 'Consistent style impression across major written traits.',
      topMatchingTraits: ['wavy dark hair'],
      secondaryMatchingTraits: [],
      weakOrUncertainTraits: [],
      mismatchWarnings: [],
      judgeNotes: 'Conservative score.',
    },
  ],
  fallbackMessage: '',
  disclaimer: RESULT_DISCLAIMER,
  ...overrides,
});
