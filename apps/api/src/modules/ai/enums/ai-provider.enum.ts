export const AiProvider = {
  Gemini: 'gemini',
} as const;

export const AI_PROVIDER_VALUES = [AiProvider.Gemini] as const;

export type AiProviderValue = (typeof AI_PROVIDER_VALUES)[number];
