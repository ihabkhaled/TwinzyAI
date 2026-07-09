import type { AiProviderValue } from './ai-provider.constants';

/**
 * One resolved routing entry: which provider serves which model. Route env
 * values are comma-separated `provider:model` tokens (a bare model id with no
 * colon means `gemini:<model>` for backward compatibility with the legacy
 * GEMINI_* chains, so a Gemini-only config keeps working unchanged).
 */
export interface AiRouteEntry {
  readonly provider: AiProviderValue;
  readonly model: string;
}

/** Canonical `provider:model` key for logs, capability lookups, and dedupe. */
export const routeEntryKey = (entry: AiRouteEntry): string => `${entry.provider}:${entry.model}`;
