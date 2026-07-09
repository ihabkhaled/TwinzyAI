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
