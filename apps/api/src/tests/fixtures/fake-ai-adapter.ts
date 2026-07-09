import type { TraitExtractionResponse } from '@twinzy/shared';
import {
  DEFAULT_RESULT_COUNT,
  GAME_PROMPT_VERSION,
  RESULT_DISCLAIMER,
  TOTAL_TRAIT_FIELDS,
  TRAIT_CATEGORY_FIELDS,
  UNCERTAINTY_NOTE_FIELDS,
} from '@twinzy/shared';

import type { GeminiStepValue } from '../../config/gemini-step.constants';
import type {
  AiCallOptions,
  AiProviderAdapter,
  AiStreamChunkListener,
  AiStreamOptions,
} from '../../modules/ai/model/ai-provider-adapter.types';
import type { AiImageInput } from '../../modules/ai/model/gemini.types';

export interface RecordedImageCall {
  prompt: string;
  image: AiImageInput;
  step?: GeminiStepValue | undefined;
}

/**
 * Deterministic AI adapter for tests. Responses are queued per method;
 * every call is recorded (prompt, image, and the pipeline step it declared)
 * so tests can assert the image never reaches the text-only pipeline steps
 * and that each service selects its own step's model chain.
 */
export class FakeAiAdapter implements AiProviderAdapter {
  public readonly imageCalls: RecordedImageCall[] = [];

  public readonly textCalls: string[] = [];

  /** Step declared by each text call, parallel to {@link textCalls}. */
  public readonly textSteps: (GeminiStepValue | undefined)[] = [];

  private readonly imageResponses: (string | Error)[] = [];

  private readonly textResponses: (string | Error)[] = [];

  public queueImageResponse(response: string | Error): void {
    this.imageResponses.push(response);
  }

  public queueTextResponse(response: string | Error): void {
    this.textResponses.push(response);
  }

  public generateFromImage(
    prompt: string,
    image: AiImageInput,
    options?: AiCallOptions,
  ): Promise<string> {
    this.imageCalls.push({ prompt, image, step: options?.step });
    return this.dequeue(this.imageResponses);
  }

  public generateFromText(prompt: string, options?: AiCallOptions): Promise<string> {
    this.textCalls.push(prompt);
    this.textSteps.push(options?.step);
    return this.dequeue(this.textResponses);
  }

  public async generateFromImageStream(
    prompt: string,
    image: AiImageInput,
    options?: AiStreamOptions,
  ): Promise<string> {
    this.imageCalls.push({ prompt, image, step: options?.step });
    options?.signal?.throwIfAborted();
    return this.streamDequeue(this.imageResponses, options?.onChunk);
  }

  public async generateFromTextStream(prompt: string, options?: AiStreamOptions): Promise<string> {
    this.textCalls.push(prompt);
    this.textSteps.push(options?.step);
    options?.signal?.throwIfAborted();
    return this.streamDequeue(this.textResponses, options?.onChunk);
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

/** Full valid Prompt 1 response (visual-similarity-v4). */
export const buildTraitExtractionPayload = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  promptVersion: GAME_PROMPT_VERSION,
  languageCode: 'en',
  traitCount: TOTAL_TRAIT_FIELDS,
  traits: buildTraitsPayload(),
  compactTraitSummary: ['clear oval face', 'wavy dark hair'],
  highSignalTraitTokens: ['oval face', 'wavy hair', 'defined jawline'],
  weightedTraitEvidence: [
    { token: 'oval face', weight: 8 },
    { token: 'wavy hair', weight: 7 },
    { token: 'defined jawline', weight: 6 },
  ],
  visualArchetypeHints: ['soft oval face with wavy dark hair'],
  imageQualityCaps: [{ quality: 'clear', impact: 'Most traits are visible and reliable.' }],
  candidateSearchHints: [
    {
      archetype: 'actors with wavy dark hair',
      why: 'The hair texture and face shape are strong signals.',
    },
  ],
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
  resultCount?: number,
): string =>
  JSON.stringify({
    promptVersion: GAME_PROMPT_VERSION,
    languageCode: 'en',
    resultCount: resultCount ?? candidates.length,
    candidateCount: candidates.length,
    candidates,
    fallbackMessage: '',
  });

export const buildJudgeSafetyCheckPayload = (
  meetsMinimumEvidence = true,
): Record<string, boolean> => ({
  containsFaceRecognitionClaim: false,
  containsBiometricClaim: false,
  containsIdentityClaim: false,
  containsExactLookalikeClaim: false,
  containsSensitiveInference: false,
  meetsMinimumEvidence,
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
  safetyCheck: buildJudgeSafetyCheckPayload(),
  ...overrides,
});

export const buildJudgeJson = (
  results: Record<string, unknown>[] = [buildJudgedResultPayload()],
  resultCount?: number,
): string =>
  JSON.stringify({
    promptVersion: GAME_PROMPT_VERSION,
    languageCode: 'en',
    resultCount: resultCount ?? results.length,
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
  resultCount: DEFAULT_RESULT_COUNT,
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
      safetyCheck: buildJudgeSafetyCheckPayload(),
    },
  ],
  fallbackMessage: '',
  disclaimer: RESULT_DISCLAIMER,
  ...overrides,
});
