import type { ParsedEnv } from './env.schema';

/**
 * The AI providers the router can dispatch to. `gemini` is the incumbent
 * (its own SDK adapter); the rest expose OpenAI-compatible chat-completions
 * endpoints served by one shared adapter parameterized per provider.
 * A provider is ENABLED iff its API key env var is non-empty — key presence
 * is the enable flag, so an operator disables a provider by removing its key.
 */
export const AiProvider = {
  Gemini: 'gemini',
  OpenAi: 'openai',
  DeepSeek: 'deepseek',
  Qwen: 'qwen',
  Kimi: 'kimi',
  Glm: 'glm',
} as const;

export type AiProviderValue = (typeof AiProvider)[keyof typeof AiProvider];

export const AI_PROVIDER_VALUES = [
  AiProvider.Gemini,
  AiProvider.OpenAi,
  AiProvider.DeepSeek,
  AiProvider.Qwen,
  AiProvider.Kimi,
  AiProvider.Glm,
] as const;

/** Every provider served by the shared OpenAI-compatible adapter (all but Gemini). */
export type OpenAiCompatProviderValue = Exclude<AiProviderValue, typeof AiProvider.Gemini>;

export const OPENAI_COMPAT_PROVIDER_VALUES = [
  AiProvider.OpenAi,
  AiProvider.DeepSeek,
  AiProvider.Qwen,
  AiProvider.Kimi,
  AiProvider.Glm,
] as const satisfies readonly OpenAiCompatProviderValue[];

/** Env keys carrying each OpenAI-compatible provider's credential + base URL. */
export const OPENAI_COMPAT_PROVIDER_ENV_KEYS = {
  [AiProvider.OpenAi]: { apiKey: 'OPENAI_API_KEY', baseUrl: 'OPENAI_BASE_URL' },
  [AiProvider.DeepSeek]: { apiKey: 'DEEPSEEK_API_KEY', baseUrl: 'DEEPSEEK_BASE_URL' },
  [AiProvider.Qwen]: { apiKey: 'QWEN_API_KEY', baseUrl: 'QWEN_BASE_URL' },
  [AiProvider.Kimi]: { apiKey: 'KIMI_API_KEY', baseUrl: 'KIMI_BASE_URL' },
  [AiProvider.Glm]: { apiKey: 'GLM_API_KEY', baseUrl: 'GLM_BASE_URL' },
} as const satisfies Record<
  Exclude<AiProviderValue, typeof AiProvider.Gemini>,
  { apiKey: keyof ParsedEnv; baseUrl: keyof ParsedEnv }
>;

/**
 * Default chat-completions base URLs (overridable via <PROVIDER>_BASE_URL).
 * Qwen uses Alibaba's INTERNATIONAL DashScope compatible-mode endpoint.
 */
export const OPENAI_COMPAT_DEFAULT_BASE_URLS = {
  [AiProvider.OpenAi]: 'https://api.openai.com/v1',
  [AiProvider.DeepSeek]: 'https://api.deepseek.com/v1',
  [AiProvider.Qwen]: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
  [AiProvider.Kimi]: 'https://api.moonshot.ai/v1',
  [AiProvider.Glm]: 'https://api.z.ai/api/paas/v4',
} as const satisfies Record<Exclude<AiProviderValue, typeof AiProvider.Gemini>, string>;
