import { readFileSync } from 'node:fs';

import {
  type CandidateGenerationResponse,
  CandidateGenerationResponseSchema,
  PROMPT_JSON_INDENT,
  type TraitExtractionResponse,
  TraitExtractionResponseSchema,
} from '@twinzy/shared';

import { routeEntryKey } from '../config/ai-route.types';
import { AI_IMAGE_STEPS, GeminiStep, type GeminiStepValue } from '../config/gemini-step.constants';
import type { ProviderRegistryService } from '../modules/ai/adapters/provider-registry.service';
import type { PromptTemplateRepository } from '../modules/ai/infrastructure/prompt-template.repository';
import { buildAiImageInput } from '../modules/ai/lib/image-input.util';
import { buildMatchingEvidence } from '../modules/ai/lib/matching-evidence.util';
import type { AiImageInput } from '../modules/ai/model/gemini.types';
import { PromptKey, PromptPlaceholder } from '../modules/ai/model/prompt-version.constants';
import { REGION_HINT_BY_LANGUAGE } from '../modules/ai/model/region-hint.constants';

import { buildValidResponseText } from './benchmark-fixtures';
import { aggregateEntryMetrics, evaluateResponseText } from './lib/benchmark-metrics.util';
import type {
  BenchmarkReport,
  BenchmarkSample,
  RealEntryRunInput,
  StepBenchmarkResult,
} from './model/benchmark.types';

/** Everything the real-mode runner borrows from the booted application. */
export interface RealBenchmarkDeps {
  readonly registry: ProviderRegistryService;
  readonly promptTemplate: PromptTemplateRepository;
}

interface RealRunState {
  extraction?: TraitExtractionResponse;
  generation?: CandidateGenerationResponse;
}

const REAL_RESULT_COUNT = 5;

const REAL_CAVEATS = [
  'REAL MODE: every sample is a live, billed provider call.',
  'Extraction measures enabled vision-declared entries; all downstream steps are text-only.',
  'Generation/judge inputs reuse the first schema-valid upstream output, so their scores share that dependency.',
] as const;

/** Measure one live call, converting a throw into a failed sample. */
const measure = async (
  step: GeminiStepValue,
  call: () => Promise<string>,
): Promise<BenchmarkSample> => {
  const startedAt = Date.now();
  try {
    const text = await call();
    return evaluateResponseText(step, text, Date.now() - startedAt);
  } catch (error: unknown) {
    return {
      ms: Date.now() - startedAt,
      schemaOk: false,
      safetyOk: false,
      failed: true,
      reason: error instanceof Error ? error.name : 'unknown-error',
    };
  }
};

/** Build the step's real prompt exactly the way its service does. */
const buildStepPrompt = (
  deps: RealBenchmarkDeps,
  step: GeminiStepValue,
  state: RealRunState,
): string => {
  if (step === GeminiStep.Extraction) {
    return deps.promptTemplate.buildPrompt(PromptKey.TraitExtraction, {
      [PromptPlaceholder.LanguageCode]: 'en',
    });
  }
  if (step === GeminiStep.Generation) {
    if (state.extraction === undefined) {
      throw new Error('generation benchmark needs a schema-valid extraction first');
    }
    return deps.promptTemplate.buildPrompt(PromptKey.CandidateGeneration, {
      [PromptPlaceholder.TraitsJson]: JSON.stringify(
        buildMatchingEvidence(state.extraction),
        null,
        PROMPT_JSON_INDENT,
      ),
      [PromptPlaceholder.LanguageCode]: 'en',
      [PromptPlaceholder.ResultCount]: String(REAL_RESULT_COUNT),
      [PromptPlaceholder.RegionHint]: REGION_HINT_BY_LANGUAGE.en,
    });
  }
  if (step === GeminiStep.Judge) {
    if (state.extraction === undefined || state.generation === undefined) {
      throw new Error('judge benchmark needs valid extraction + generation first');
    }
    return deps.promptTemplate.buildPrompt(PromptKey.CandidateJudge, {
      [PromptPlaceholder.TraitsJson]: JSON.stringify(
        buildMatchingEvidence(state.extraction),
        null,
        PROMPT_JSON_INDENT,
      ),
      [PromptPlaceholder.CandidatesJson]: JSON.stringify(
        { candidates: state.generation.candidates },
        null,
        PROMPT_JSON_INDENT,
      ),
      [PromptPlaceholder.LanguageCode]: 'en',
      [PromptPlaceholder.ResultCount]: String(REAL_RESULT_COUNT),
    });
  }
  return deps.promptTemplate.buildPrompt(PromptKey.TranslateResult, {
    [PromptPlaceholder.ResultJson]: buildValidResponseText(GeminiStep.Translation),
    [PromptPlaceholder.TargetLanguageCode]: 'ar',
  });
};

/** Remember the first schema-valid upstream output for downstream steps. */
const captureUpstream = (step: GeminiStepValue, text: string, state: RealRunState): void => {
  try {
    if (step === GeminiStep.Extraction && state.extraction === undefined) {
      state.extraction = TraitExtractionResponseSchema.parse(JSON.parse(text));
    }
    if (step === GeminiStep.Generation && state.generation === undefined) {
      state.generation = CandidateGenerationResponseSchema.parse(JSON.parse(text));
    }
  } catch {
    // Not valid — the sample metrics already record that.
  }
};

const runRealEntry = async (
  deps: RealBenchmarkDeps,
  input: RealEntryRunInput,
  state: RealRunState,
): Promise<BenchmarkSample[]> => {
  const { step, entry, image, samplesPerEntry } = input;
  const adapter = deps.registry.adapterFor(entry.provider);
  if (adapter === undefined) {
    return [];
  }
  const carriesImage = (AI_IMAGE_STEPS as readonly GeminiStepValue[]).includes(step);
  const samples: BenchmarkSample[] = [];
  for (let index = 0; index < samplesPerEntry; index += 1) {
    const prompt = buildStepPrompt(deps, step, state);
    const sample = await measure(step, async () => {
      const text =
        carriesImage && image !== undefined
          ? await adapter.generateFromImageStream(prompt, image, { models: [entry.model], step })
          : await adapter.generateFromTextStream(prompt, { models: [entry.model], step });
      captureUpstream(step, text, state);
      return text;
    });
    samples.push(sample);
  }
  return samples;
};

const skipReasonForStep = (
  step: GeminiStepValue,
  image: AiImageInput | undefined,
  state: RealRunState,
): string | undefined => {
  if (step === GeminiStep.Extraction && image === undefined) {
    return 'image step needs --photo=<path>';
  }
  if (step === GeminiStep.Generation && state.extraction === undefined) {
    return 'generation needs a valid extraction';
  }
  if (
    step === GeminiStep.Judge &&
    (state.extraction === undefined || state.generation === undefined)
  ) {
    return 'judge needs valid extraction + generation';
  }
  return undefined;
};

const runRealStep = async (
  deps: RealBenchmarkDeps,
  step: GeminiStepValue,
  image: AiImageInput | undefined,
  samplesPerEntry: number,
  state: RealRunState,
): Promise<StepBenchmarkResult> => {
  const carriesImage = (AI_IMAGE_STEPS as readonly GeminiStepValue[]).includes(step);
  const skipReason = skipReasonForStep(step, image, state);
  if (skipReason !== undefined) {
    return { step, entries: [], notes: [`skipped: ${skipReason}`] };
  }
  const entries = deps.registry.usableEntriesFor(step, carriesImage);
  if (entries.length === 0) {
    return {
      step,
      entries: [],
      notes: [
        carriesImage ? 'skipped: no enabled vision-capable entries' : 'skipped: no enabled entries',
      ],
    };
  }
  const notes: string[] = [];
  const measured = [];
  for (const entry of entries) {
    const samples = await runRealEntry(deps, { step, entry, image, samplesPerEntry }, state);
    if (samples.length > 0) {
      measured.push(aggregateEntryMetrics(routeEntryKey(entry), samples));
    }
  }
  const best = measured.toSorted((a, b) => b.score - a.score)[0];
  return {
    step,
    entries: measured,
    recommendation: best === undefined ? undefined : `${best.entryKey} (score ${best.score})`,
    notes,
  };
};

/** Live benchmark across every configured, usable route entry per step. */
export const runRealBenchmark = async (
  deps: RealBenchmarkDeps,
  samplesPerEntry: number,
  startedAtIso: string,
  photoPath?: string,
): Promise<BenchmarkReport> => {
  let image: AiImageInput | undefined;
  if (photoPath !== undefined) {
    const buffer = readFileSync(photoPath);
    try {
      image = buildAiImageInput({ buffer, mimetype: 'image/jpeg' });
    } finally {
      buffer.fill(0);
    }
  }
  const state: RealRunState = {};
  const steps: StepBenchmarkResult[] = [];
  for (const step of Object.values(GeminiStep)) {
    steps.push(await runRealStep(deps, step, image, samplesPerEntry, state));
    if (step === GeminiStep.Extraction) {
      image = undefined;
    }
  }
  return { mode: 'real', startedAtIso, samplesPerEntry, steps, caveats: [...REAL_CAVEATS] };
};
