import { describe, expect, it, vi } from 'vitest';

import type { Candidate, CandidateJudgeResponse } from '@twinzy/shared';
import { CandidateJudgeResponseSchema } from '@twinzy/shared';

import { AiProvider } from '../../../config/ai-provider.constants';
import {
  buildCandidatePayload,
  buildJudgedResultPayload,
  buildJudgeJson,
  buildTraitExtraction,
} from '../../../tests/fixtures/fake-ai-adapter';
import { buildAppLoggerStub, buildConfigStub } from '../../../tests/fixtures/stubs';
import { ConsensusFinalizerService } from '../application/consensus-finalizer.service';
import type { MultiModelCouncilService } from '../application/multi-model-council.service';
import { PromptTemplateRepository } from '../infrastructure/prompt-template.repository';

const authoritative = CandidateJudgeResponseSchema.parse(
  JSON.parse(
    buildJudgeJson([
      buildJudgedResultPayload({
        entityId: 'Q170515',
        finalStyleVibeFitScore: 73,
      }),
    ]),
  ),
);

const candidate = {
  ...buildCandidatePayload(),
  entityId: 'Q170515',
} as unknown as Candidate;

const input = {
  extraction: buildTraitExtraction(),
  candidates: [candidate],
  languageCode: 'en' as const,
  resultCount: 1,
};

const finalizerPayload = {
  languageCode: 'en',
  explanations: [
    {
      entityId: 'Q170515',
      finalReason: 'Localized evidence-only reason.',
      mismatchWarnings: ['Some evidence remains uncertain.'],
      judgeNotes: 'The backend score is unchanged.',
    },
    {
      entityId: 'Q999',
      finalReason: 'Unknown result.',
      mismatchWarnings: [],
      judgeNotes: 'Ignored.',
    },
  ],
};

const finalizerText = JSON.stringify(finalizerPayload);

const buildService = (
  configured: boolean,
  councilText = finalizerText,
): {
  service: ConsensusFinalizerService;
  council: MultiModelCouncilService;
} => {
  const config = buildConfigStub({
    advancedMatching: {
      ...buildConfigStub().advancedMatching,
      finalizer: configured
        ? { provider: AiProvider.Gemini, model: 'configured-finalizer' }
        : undefined,
    },
  });
  const council = {
    runTextCouncil: vi.fn().mockResolvedValue(
      councilText.length === 0
        ? []
        : [
            {
              participantId: 'gemini:configured-finalizer',
              text: councilText,
            },
          ],
    ),
  } as unknown as MultiModelCouncilService;
  const { logger } = buildAppLoggerStub();
  return {
    service: new ConsensusFinalizerService(
      config,
      council,
      new PromptTemplateRepository(config, logger),
    ),
    council,
  };
};

describe('ConsensusFinalizerService', () => {
  it('preserves backend output without a configured finalizer', async () => {
    const { service, council } = buildService(false);

    await expect(service.finalize(input, authoritative)).resolves.toBe(authoritative);
    expect(council.runTextCouncil).not.toHaveBeenCalled();
  });

  it('applies localized prose but cannot change scores, entities, or candidates', async () => {
    const { service, council } = buildService(true);

    const result = await service.finalize(input, authoritative);

    expect(result.results[0]).toMatchObject({
      entityId: 'Q170515',
      finalStyleVibeFitScore: 73,
      finalReason: 'Localized evidence-only reason.',
      mismatchWarnings: ['Some evidence remains uncertain.'],
      judgeNotes: 'The backend score is unchanged.',
    });
    expect(result.results).toHaveLength(1);
    expect(council.runTextCouncil).toHaveBeenCalledWith(
      expect.objectContaining({
        participants: [{ provider: AiProvider.Gemini, model: 'configured-finalizer' }],
        minimumSuccessfulParticipants: 1,
      }),
    );
  });

  it.each([
    ['wrong language', JSON.stringify({ ...finalizerPayload, languageCode: 'ar' })],
    ['invalid JSON', 'not-json'],
    ['empty council', ''],
  ])('falls back to authoritative prose after %s', async (_label, text) => {
    const { service } = buildService(true, text);

    await expect(service.finalize(input, authoritative)).resolves.toBe(authoritative);
  });

  it('preserves unresolved results that cannot be keyed by entity id', async () => {
    const first = authoritative.results[0];
    if (first === undefined) {
      throw new Error('Test fixture is incomplete');
    }
    const unresolved: CandidateJudgeResponse = {
      ...authoritative,
      results: [{ ...first, entityId: undefined }],
    };
    const { service } = buildService(true);

    const result = await service.finalize(input, unresolved);

    expect(result.results[0]).toEqual(unresolved.results[0]);
  });
});
