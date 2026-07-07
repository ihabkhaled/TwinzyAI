import { describe, expect, it } from 'vitest';

import { StreamRegistry } from '../../../core/streaming';
import { buildAppLoggerStub, buildConfigStub } from '../../../tests/fixtures/stubs';
import { CancelAnalysisUseCase } from '../application/cancel-analysis.use-case';

const KEY = { streamId: 'stream-1', tabId: 'tab-1', requestId: 'req-1' };

const buildRegistry = (): StreamRegistry =>
  new StreamRegistry(buildConfigStub(), buildAppLoggerStub().logger);

describe('CancelAnalysisUseCase', () => {
  it('cancels a matching in-flight stream and reports it', () => {
    const registry = buildRegistry();
    const controller = new AbortController();
    registry.register({ ...KEY, controller });
    const useCase = new CancelAnalysisUseCase(registry);

    expect(useCase.cancel(KEY)).toEqual({ cancelled: true });
    expect(controller.signal.aborted).toBe(true);
  });

  it('reports cancelled:false for an unknown stream', () => {
    const useCase = new CancelAnalysisUseCase(buildRegistry());

    expect(useCase.cancel(KEY)).toEqual({ cancelled: false });
  });
});
