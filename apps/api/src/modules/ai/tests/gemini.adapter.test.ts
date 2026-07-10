import { beforeEach, describe, expect, it } from 'vitest';

import { AppError, ErrorCode } from '../../../core/errors';
import { buildAppLoggerStub, buildConfigStub } from '../../../tests/fixtures/stubs';
import { GeminiAdapter } from '../adapters/gemini.adapter';

interface CallParams {
  model: string;
}

interface FakeChunk {
  text: string;
}

/**
 * Minimal structural stand-in for the Gemini SDK client (no vendor import).
 * Queues a per-model response: a string (delivered as a one-chunk stream) or an
 * Error thrown during iteration, mirroring how the real stream surfaces errors.
 */
class FakeGoogleClient {
  private readonly responses = new Map<string, string | Error>();

  public readonly modelsTried: string[] = [];

  public setResponse(model: string, response: string | Error): void {
    this.responses.set(model, response);
  }

  public readonly models = {
    generateContentStream: (params: CallParams): Promise<AsyncIterable<FakeChunk>> =>
      Promise.resolve(this.streamFor(params.model)),
    generateContent: (params: CallParams): Promise<FakeChunk> =>
      Promise.resolve({ text: this.resolve(params.model) }),
  };

  private streamFor(model: string): AsyncIterable<FakeChunk> {
    const resolve = (): string => this.resolve(model);
    return {
      async *[Symbol.asyncIterator](): AsyncGenerator<FakeChunk> {
        await Promise.resolve();
        yield { text: resolve() };
      },
    };
  }

  private resolve(model: string): string {
    this.modelsTried.push(model);
    const response = this.responses.get(model);
    if (response === undefined) {
      throw new Error(`FakeGoogleClient: no response for ${model}`);
    }
    if (response instanceof Error) {
      throw response;
    }
    return response;
  }
}

const buildAdapter = (
  fake: FakeGoogleClient,
  chain: string[],
  aiMaxResponseBytes = 500_000,
): GeminiAdapter => {
  const config = buildConfigStub({
    geminiModelChain: chain,
    geminiApiKey: 'test-key',
    aiMaxResponseBytes,
  });
  const adapter = new GeminiAdapter(config, buildAppLoggerStub().logger);
  (adapter as unknown as { client: unknown }).client = fake;
  return adapter;
};

const rateLimitError = (): Error => new Error('{ "error": { "code": 429 } } quota exceeded');

const expectErrorCode = async (action: Promise<unknown>, code: string): Promise<void> => {
  let caught: unknown;
  try {
    await action;
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(AppError);
  expect((caught as AppError).errorCode).toBe(code);
};

describe('GeminiAdapter model-fallback chain', () => {
  let fake: FakeGoogleClient;

  beforeEach(() => {
    fake = new FakeGoogleClient();
  });

  it('returns the primary model result when it succeeds', async () => {
    fake.setResponse('primary', '{"ok":true}');
    const adapter = buildAdapter(fake, ['primary', 'fallback']);

    await expect(adapter.generateFromTextStream('prompt')).resolves.toBe('{"ok":true}');
    expect(fake.modelsTried).toEqual(['primary']);
  });

  it('falls back to the next model when the primary is rate-limited', async () => {
    fake.setResponse('primary', rateLimitError());
    fake.setResponse('fallback', '{"ok":true}');
    const adapter = buildAdapter(fake, ['primary', 'fallback']);

    await expect(adapter.generateFromTextStream('prompt')).resolves.toBe('{"ok":true}');
    expect(fake.modelsTried).toEqual(['primary', 'fallback']);
  });

  it('surfaces AI_RATE_LIMITED (429) when every model is rate-limited', async () => {
    fake.setResponse('primary', rateLimitError());
    fake.setResponse('fallback', rateLimitError());
    const adapter = buildAdapter(fake, ['primary', 'fallback']);

    await expectErrorCode(adapter.generateFromTextStream('prompt'), ErrorCode.AiRateLimited);
    expect(fake.modelsTried).toEqual(['primary', 'fallback']);
  });

  it('falls back on a model-unavailable error, then succeeds', async () => {
    fake.setResponse('primary', new Error('models/primary is not found (404)'));
    fake.setResponse('fallback', '{"ok":true}');
    const adapter = buildAdapter(fake, ['primary', 'fallback']);

    await expect(adapter.generateFromTextStream('prompt')).resolves.toBe('{"ok":true}');
    expect(fake.modelsTried).toEqual(['primary', 'fallback']);
  });

  it('stops immediately on a fatal (non-retryable) error without trying fallbacks', async () => {
    fake.setResponse('primary', new Error('malformed request payload'));
    fake.setResponse('fallback', '{"ok":true}');
    const adapter = buildAdapter(fake, ['primary', 'fallback']);

    await expectErrorCode(
      adapter.generateFromTextStream('prompt'),
      ErrorCode.AiProviderUnavailable,
    );
    expect(fake.modelsTried).toEqual(['primary']);
  });

  it('exhausts the chain to AI_PROVIDER_UNAVAILABLE when all models are unavailable', async () => {
    fake.setResponse('primary', new Error('503 overloaded'));
    fake.setResponse('fallback', new Error('503 overloaded'));
    const adapter = buildAdapter(fake, ['primary', 'fallback']);

    await expectErrorCode(
      adapter.generateFromTextStream('prompt'),
      ErrorCode.AiProviderUnavailable,
    );
  });

  it('rejects a raw response above the configured byte cap', async () => {
    fake.setResponse('primary', 'x'.repeat(20));
    const adapter = buildAdapter(fake, ['primary'], 10);

    await expectErrorCode(adapter.generateFromTextStream('prompt'), ErrorCode.AiResponseInvalid);
  });
});

describe('GeminiAdapter per-step model chains', () => {
  let fake: FakeGoogleClient;

  beforeEach(() => {
    fake = new FakeGoogleClient();
  });

  const buildSteppedAdapter = (client: FakeGoogleClient): GeminiAdapter => {
    const config = buildConfigStub({
      geminiApiKey: 'test-key',
      geminiModelChain: ['global-model'],
      geminiStepModelChains: { translation: ['cheap-model', 'cheap-fallback'] },
    });
    const adapter = new GeminiAdapter(config, buildAppLoggerStub().logger);
    (adapter as unknown as { client: unknown }).client = client;
    return adapter;
  };

  it('uses the step chain when the call declares a configured step', async () => {
    fake.setResponse('cheap-model', '{"ok":true}');
    const adapter = buildSteppedAdapter(fake);

    await expect(adapter.generateFromTextStream('prompt', { step: 'translation' })).resolves.toBe(
      '{"ok":true}',
    );
    expect(fake.modelsTried).toEqual(['cheap-model']);
  });

  it('falls through within the step chain, never touching the global chain', async () => {
    fake.setResponse('cheap-model', rateLimitError());
    fake.setResponse('cheap-fallback', '{"ok":true}');
    const adapter = buildSteppedAdapter(fake);

    await expect(adapter.generateFromTextStream('prompt', { step: 'translation' })).resolves.toBe(
      '{"ok":true}',
    );
    expect(fake.modelsTried).toEqual(['cheap-model', 'cheap-fallback']);
  });

  it('uses the global chain for a step without per-step configuration', async () => {
    fake.setResponse('global-model', '{"ok":true}');
    const adapter = buildSteppedAdapter(fake);

    await expect(adapter.generateFromTextStream('prompt', { step: 'judge' })).resolves.toBe(
      '{"ok":true}',
    );
    expect(fake.modelsTried).toEqual(['global-model']);
  });

  it('uses the global chain when the call declares no step at all', async () => {
    fake.setResponse('global-model', '{"ok":true}');
    const adapter = buildSteppedAdapter(fake);

    await expect(adapter.generateFromTextStream('prompt')).resolves.toBe('{"ok":true}');
    expect(fake.modelsTried).toEqual(['global-model']);
  });
});
