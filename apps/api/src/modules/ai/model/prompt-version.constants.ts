/**
 * Prompt contract version. Bump when any prompt file changes shape or
 * safety rules — tests and docs reference this.
 */
export const PROMPT_VERSION = '1.0.0';

/** Safe, user-facing fallback surfaced when prompt loading/building fails. */
export const GENERIC_PROMPT_ERROR = 'The game is temporarily unavailable. Please try again.';

export const PromptKey = {
  TraitExtraction: 'trait-extraction',
  CandidateGeneration: 'candidate-generation',
  CandidateJudge: 'candidate-judge',
} as const;

export type PromptKeyValue = (typeof PromptKey)[keyof typeof PromptKey];

export const PROMPT_FILES: Record<PromptKeyValue, string> = {
  [PromptKey.TraitExtraction]: 'use-1st-prompt.md',
  [PromptKey.CandidateGeneration]: 'use-2nd-prompt.md',
  [PromptKey.CandidateJudge]: 'use-3rd-prompt.md',
};

export const PromptPlaceholder = {
  TraitsJson: '[TRAITS_JSON]',
  CandidatesJson: '[CANDIDATES_JSON]',
  AppName: '[APP_NAME]',
  ModelProvider: '[MODEL_PROVIDER]',
} as const;

export type PromptPlaceholderValue = (typeof PromptPlaceholder)[keyof typeof PromptPlaceholder];

/** Placeholders that MUST exist in the template and MUST be replaced. */
export const REQUIRED_PLACEHOLDERS: Record<PromptKeyValue, readonly PromptPlaceholderValue[]> = {
  [PromptKey.TraitExtraction]: [],
  [PromptKey.CandidateGeneration]: [PromptPlaceholder.TraitsJson],
  [PromptKey.CandidateJudge]: [PromptPlaceholder.TraitsJson, PromptPlaceholder.CandidatesJson],
};
