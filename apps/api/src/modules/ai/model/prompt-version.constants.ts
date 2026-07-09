/** Safe, user-facing fallback surfaced when prompt loading/building fails. */
export const GENERIC_PROMPT_ERROR = 'The game is temporarily unavailable. Please try again.';

export const PromptKey = {
  TraitExtraction: 'trait-extraction',
  CandidateGeneration: 'candidate-generation',
  CandidateJudge: 'candidate-judge',
  TranslateResult: 'translate-result',
} as const;

export type PromptKeyValue = (typeof PromptKey)[keyof typeof PromptKey];

export const PROMPT_FILES: Record<PromptKeyValue, string> = {
  [PromptKey.TraitExtraction]: 'use-1st-prompt.md',
  [PromptKey.CandidateGeneration]: 'use-2nd-prompt.md',
  [PromptKey.CandidateJudge]: 'use-3rd-prompt.md',
  [PromptKey.TranslateResult]: 'translate-result-prompt.md',
};

export const PromptPlaceholder = {
  TraitsJson: '[TRAITS_JSON]',
  CandidatesJson: '[CANDIDATES_JSON]',
  ResultJson: '[RESULT_JSON]',
  LanguageCode: '[LANGUAGE_CODE]',
  TargetLanguageCode: '[TARGET_LANGUAGE_CODE]',
  AppName: '[APP_NAME]',
  ModelProvider: '[MODEL_PROVIDER]',
  ResultCount: '[RESULT_COUNT]',
  RegionHint: '[REGION_HINT]',
} as const;

export type PromptPlaceholderValue = (typeof PromptPlaceholder)[keyof typeof PromptPlaceholder];

/** Placeholders that MUST exist in the template and MUST be replaced. */
export const REQUIRED_PLACEHOLDERS: Record<PromptKeyValue, readonly PromptPlaceholderValue[]> = {
  [PromptKey.TraitExtraction]: [PromptPlaceholder.LanguageCode],
  [PromptKey.CandidateGeneration]: [
    PromptPlaceholder.TraitsJson,
    PromptPlaceholder.LanguageCode,
    PromptPlaceholder.ResultCount,
    PromptPlaceholder.RegionHint,
  ],
  [PromptKey.CandidateJudge]: [
    PromptPlaceholder.TraitsJson,
    PromptPlaceholder.CandidatesJson,
    PromptPlaceholder.LanguageCode,
    PromptPlaceholder.ResultCount,
  ],
  [PromptKey.TranslateResult]: [PromptPlaceholder.ResultJson, PromptPlaceholder.TargetLanguageCode],
};
