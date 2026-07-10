import type { ParsedEnv } from './env.schema';

/**
 * The four AI pipeline steps that can each carry their own Gemini model chain.
 * Difficulty differs sharply per step (extraction is the hardest structured
 * task, translation is a cheap mechanical one), so each step may be pinned to
 * the model chain that fits it — configured exclusively via env (never
 * hardcoded), with the global GEMINI_MODEL/GEMINI_FALLBACK_MODELS chain as the
 * safety net for any step left unconfigured.
 */
export const GeminiStep = {
  Extraction: 'extraction',
  Generation: 'generation',
  Judge: 'judge',
  Translation: 'translation',
} as const;

export type GeminiStepValue = (typeof GeminiStep)[keyof typeof GeminiStep];

/** Env-variable pair (primary + comma-separated fallbacks) for each step. */
export const GEMINI_STEP_ENV_KEYS = {
  [GeminiStep.Extraction]: {
    model: 'GEMINI_MODEL_EXTRACTION',
    fallbacks: 'GEMINI_FALLBACK_MODELS_EXTRACTION',
  },
  [GeminiStep.Generation]: {
    model: 'GEMINI_MODEL_GENERATION',
    fallbacks: 'GEMINI_FALLBACK_MODELS_GENERATION',
  },
  [GeminiStep.Judge]: {
    model: 'GEMINI_MODEL_JUDGE',
    fallbacks: 'GEMINI_FALLBACK_MODELS_JUDGE',
  },
  [GeminiStep.Translation]: {
    model: 'GEMINI_MODEL_TRANSLATION',
    fallbacks: 'GEMINI_FALLBACK_MODELS_TRANSLATION',
  },
} as const satisfies Record<
  GeminiStepValue,
  { model: keyof ParsedEnv; fallbacks: keyof ParsedEnv }
>;

/** Env key carrying each step's multi-provider route chain (`provider:model` list). */
export const AI_STEP_ROUTE_ENV_KEYS = {
  [GeminiStep.Extraction]: 'AI_ROUTE_EXTRACTION',
  [GeminiStep.Generation]: 'AI_ROUTE_GENERATION',
  [GeminiStep.Judge]: 'AI_ROUTE_JUDGE',
  [GeminiStep.Translation]: 'AI_ROUTE_TRANSLATION',
} as const satisfies Record<GeminiStepValue, keyof ParsedEnv>;

/** Env key carrying each step's optional shadow route (single `provider:model`). */
export const AI_STEP_SHADOW_ROUTE_ENV_KEYS: Partial<Record<GeminiStepValue, keyof ParsedEnv>> = {
  [GeminiStep.Generation]: 'AI_SHADOW_ROUTE_GENERATION',
  [GeminiStep.Judge]: 'AI_SHADOW_ROUTE_JUDGE',
  [GeminiStep.Translation]: 'AI_SHADOW_ROUTE_TRANSLATION',
};

/**
 * The sole provider step allowed to carry the user's photo. Candidate
 * generation, judging, and translation are text-only by construction.
 */
export const AI_IMAGE_STEPS = [GeminiStep.Extraction] as const satisfies readonly GeminiStepValue[];
