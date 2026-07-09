import { AI_PROVIDER_VALUES, AiProvider, type AiProviderValue } from './ai-provider.constants';
import type { AiRouteEntry } from './ai-route.types';

const isKnownProvider = (value: string): value is AiProviderValue =>
  (AI_PROVIDER_VALUES as readonly string[]).includes(value);

/**
 * Parse one route token. `provider:model` selects a provider explicitly; a
 * bare model id (no colon) means `gemini:<model>` so every legacy GEMINI_*
 * value remains a valid route. Unknown providers throw a readable error —
 * route parsing runs during startup validation, so a typo fails the boot
 * instead of a user request.
 */
export const parseAiRouteToken = (token: string, sourceKey: string): AiRouteEntry => {
  const separatorIndex = token.indexOf(':');
  if (separatorIndex === -1) {
    return { provider: AiProvider.Gemini, model: token };
  }
  const provider = token.slice(0, separatorIndex).trim();
  const model = token.slice(separatorIndex + 1).trim();
  if (!isKnownProvider(provider)) {
    throw new Error(
      `Invalid AI route in ${sourceKey}: unknown provider "${provider}" (known: ${AI_PROVIDER_VALUES.join(', ')})`,
    );
  }
  if (model.length === 0) {
    throw new Error(`Invalid AI route in ${sourceKey}: empty model in token "${token}"`);
  }
  return { provider, model };
};

/** Parse a comma-separated route list, trimming and dropping empty tokens. */
export const parseAiRouteList = (raw: string, sourceKey: string): AiRouteEntry[] =>
  raw
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
    .map((token) => parseAiRouteToken(token, sourceKey));
