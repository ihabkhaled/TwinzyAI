import { describe, expect, it } from 'vitest';

import type { Candidate } from '@twinzy/shared';
import { DEFAULT_RESULT_COUNT } from '@twinzy/shared';

import type { AppConfigService } from '../../../config/app-config.service';
import {
  buildCandidatePayload,
  buildCandidatesJson,
  buildTraitExtraction,
  FakeAiAdapter,
} from '../../../tests/fixtures/fake-ai-adapter';
import { buildAppLoggerStub, buildConfigStub } from '../../../tests/fixtures/stubs';
import { AiSafetyService } from '../application/ai-safety.service';
import { AiStepConcurrencyGate } from '../application/ai-step-concurrency.gate';
import { CandidateGenerationService } from '../application/candidate-generation.service';
import { CandidateRecallService } from '../application/candidate-recall.service';
import { PromptTemplateRepository } from '../infrastructure/prompt-template.repository';

interface Harness {
  adapter: FakeAiAdapter;
  service: CandidateRecallService;
}

const buildHarness = (configOverrides: Parameters<typeof buildConfigStub>[0] = {}): Harness => {
  const adapter = new FakeAiAdapter();
  const { logger } = buildAppLoggerStub();
  const config: AppConfigService = buildConfigStub({
    aiParallelPipelineEnabled: true,
    aiGenerationLanes: 2,
    aiGenerationConcurrency: 2,
    aiMaxCallsPerAnalysis: 5,
    ...configOverrides,
  });
  const promptTemplate = new PromptTemplateRepository(config, logger);
  const safety = new AiSafetyService(logger);
  const generation = new CandidateGenerationService(adapter, promptTemplate, safety, logger);
  const gate = new AiStepConcurrencyGate(config);
  const service = new CandidateRecallService(generation, gate, config, logger);
  return { adapter, service };
};

const extraction = buildTraitExtraction();

const recall = (harness: Harness): Promise<Candidate[]> =>
  harness.service.recall({ extraction, languageCode: 'en', resultCount: DEFAULT_RESULT_COUNT });

describe('CandidateRecallService (parallel mode)', () => {
  it('fans out one lane per configured lane and never sends an image', async () => {
    const harness = buildHarness();
    harness.adapter.queueTextResponse(
      buildCandidatesJson([buildCandidatePayload({ name: 'Lane One Star' })]),
    );
    harness.adapter.queueTextResponse(
      buildCandidatesJson([buildCandidatePayload({ name: 'Lane Two Star' })]),
    );

    const merged = await recall(harness);

    expect(harness.adapter.textCalls).toHaveLength(2);
    expect(harness.adapter.imageCalls).toHaveLength(0);
    expect(harness.adapter.textSteps).toEqual(['generation', 'generation']);
    expect(
      merged.map((candidate) => candidate.name).toSorted((a, b) => a.localeCompare(b)),
    ).toEqual(['Lane One Star', 'Lane Two Star']);
  });

  it('gives each lane a distinct recall focus in its prompt', async () => {
    const harness = buildHarness();
    harness.adapter.queueTextResponse(buildCandidatesJson());
    harness.adapter.queueTextResponse(buildCandidatesJson());

    await recall(harness);

    expect(harness.adapter.textCalls[0]).toContain('STRONGEST');
    expect(harness.adapter.textCalls[1]).toContain('DIVERSE');
    expect(harness.adapter.textCalls[0]).toContain('Lane focus');
  });

  it('dedupes the same figure across lanes, keeping the higher score', async () => {
    const harness = buildHarness();
    harness.adapter.queueTextResponse(
      buildCandidatesJson([buildCandidatePayload({ name: 'Shared Star', styleVibeFitScore: 70 })]),
    );
    harness.adapter.queueTextResponse(
      buildCandidatesJson([buildCandidatePayload({ name: 'shared star', styleVibeFitScore: 92 })]),
    );

    const merged = await recall(harness);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.styleVibeFitScore).toBe(92);
  });

  it('keeps the analysis alive when one lane fails', async () => {
    const harness = buildHarness();
    harness.adapter.queueTextResponse(
      buildCandidatesJson([buildCandidatePayload({ name: 'Survivor Star' })]),
    );
    harness.adapter.queueTextResponse(new Error('provider exploded'));

    const merged = await recall(harness);

    expect(merged.map((candidate) => candidate.name)).toEqual(['Survivor Star']);
  });

  it('returns an empty pool (caller falls back) when every lane fails', async () => {
    const harness = buildHarness();
    harness.adapter.queueTextResponse(new Error('down'));
    harness.adapter.queueTextResponse(new Error('down'));

    await expect(recall(harness)).resolves.toEqual([]);
  });

  it('clamps lane count to the per-analysis call budget', async () => {
    // budget 3 - reserved 2 (extraction + judge) => at most 1 generation lane.
    const harness = buildHarness({ aiGenerationLanes: 2, aiMaxCallsPerAnalysis: 3 });
    harness.adapter.queueTextResponse(buildCandidatesJson());

    await recall(harness);

    expect(harness.adapter.textCalls).toHaveLength(1);
  });
});

describe('CandidateRecallService (single-call mode, flag off)', () => {
  it('makes exactly one un-focused generation call and never sends an image', async () => {
    const harness = buildHarness({ aiParallelPipelineEnabled: false });
    harness.adapter.queueTextResponse(
      buildCandidatesJson([buildCandidatePayload({ name: 'Only Star' })]),
    );

    const merged = await recall(harness);

    expect(harness.adapter.textCalls).toHaveLength(1);
    expect(harness.adapter.imageCalls).toHaveLength(0);
    expect(harness.adapter.textCalls[0]).not.toContain('Lane focus');
    expect(merged.map((candidate) => candidate.name)).toEqual(['Only Star']);
  });
});
