import { describe, expect, it, vi } from 'vitest';

import { AiProvider, type AiProviderValue } from '../../../config/ai-provider.constants';
import type { AiRouteEntry } from '../../../config/ai-route.types';
import type { ProviderRegistryService } from '../adapters/provider-registry.service';
import { MultiModelCouncilService } from '../application/multi-model-council.service';
import type { AiProviderAdapter } from '../model/ai-provider-adapter.types';

const participants: readonly AiRouteEntry[] = [
  { provider: AiProvider.Gemini, model: 'configured-gemini' },
  { provider: AiProvider.OpenAi, model: 'configured-gpt' },
  { provider: AiProvider.DeepSeek, model: 'configured-deepseek' },
];

const adapter = (result: string | Error): AiProviderAdapter =>
  ({
    generateFromTextStream: vi.fn(() =>
      result instanceof Error ? Promise.reject(result) : Promise.resolve(result),
    ),
  }) as unknown as AiProviderAdapter;

describe('MultiModelCouncilService', () => {
  it('runs the same text-only prompt for every participant and degrades after one failure', async () => {
    const adapters = new Map<AiProviderValue, AiProviderAdapter>([
      [AiProvider.Gemini, adapter('gemini-result')],
      [AiProvider.OpenAi, adapter(new Error('provider unavailable'))],
      [AiProvider.DeepSeek, adapter('deepseek-result')],
    ]);
    const registry = {
      adapterFor: (provider: AiProviderValue): AiProviderAdapter | undefined =>
        adapters.get(provider),
    } as unknown as ProviderRegistryService;
    const service = new MultiModelCouncilService(registry);

    const results = await service.runTextCouncil({
      prompt: 'same verified shortlist',
      participants,
      minimumSuccessfulParticipants: 2,
      timeoutMs: 5000,
    });

    expect(results.map((result) => result.participantId)).toEqual([
      'gemini:configured-gemini',
      'deepseek:configured-deepseek',
    ]);
    for (const value of adapters.values()) {
      const call = vi.mocked(value.generateFromTextStream).mock.calls[0];
      expect(call?.[0]).toBe('same verified shortlist');
      expect(call?.[1]?.models).toHaveLength(1);
    }
  });

  it('fails the council when fewer than the configured minimum succeed', async () => {
    const registry = {
      adapterFor: (): AiProviderAdapter => adapter(new Error('failed')),
    } as unknown as ProviderRegistryService;
    const service = new MultiModelCouncilService(registry);

    await expect(
      service.runTextCouncil({
        prompt: 'same verified shortlist',
        participants,
        minimumSuccessfulParticipants: 2,
        timeoutMs: 5000,
      }),
    ).rejects.toThrow('minimum successful participants');
  });

  it('skips configured participants whose provider adapter is unavailable', async () => {
    const gemini = adapter('gemini-result');
    const registry = {
      adapterFor: (provider: AiProviderValue): AiProviderAdapter | undefined =>
        provider === AiProvider.Gemini ? gemini : undefined,
    } as unknown as ProviderRegistryService;
    const service = new MultiModelCouncilService(registry);

    const results = await service.runTextCouncil({
      prompt: 'same verified shortlist',
      participants,
      minimumSuccessfulParticipants: 1,
      timeoutMs: 5000,
    });

    expect(results).toEqual([
      {
        participantId: 'gemini:configured-gemini',
        text: 'gemini-result',
      },
    ]);
  });
});
