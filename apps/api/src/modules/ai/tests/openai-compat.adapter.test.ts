import { afterEach, describe, expect, it, vi } from 'vitest';

import { ErrorCode } from '../../../core/errors';
import { buildAppLoggerStub, buildConfigStub } from '../../../tests/fixtures/stubs';
import { OpenAiCompatAdapter } from '../adapters/openai-compat.adapter';
import type { AiImageInput } from '../model/gemini.types';

const buildAdapter = (): OpenAiCompatAdapter =>
  new OpenAiCompatAdapter('deepseek', buildConfigStub(), buildAppLoggerStub().logger);

const okResponse = (content: string): Response =>
  Response.json({ choices: [{ message: { content } }] }, { status: 200 });

const image: AiImageInput = { mimeType: 'image/jpeg', base64Data: 'aW1n' };

const lastFetchCall = (fetchMock: ReturnType<typeof vi.fn>): { url: string; init: RequestInit } => {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return { url, init };
};

describe('OpenAiCompatAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs the pinned model to <baseUrl>/chat/completions with bearer auth + JSON mode', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(okResponse('{"ok":true}')));
    vi.stubGlobal('fetch', fetchMock);

    const text = await buildAdapter().generateFromTextStream('the prompt', {
      models: ['deepseek-v4-flash'],
      step: 'translation',
    });

    expect(text).toBe('{"ok":true}');
    const { url, init } = lastFetchCall(fetchMock);
    expect(url).toBe('https://provider.test/v1/chat/completions');
    expect((init.headers as Record<string, string>)['authorization']).toBe('Bearer test-key');
    const body = JSON.parse(init.body as string) as {
      model: string;
      messages: { content: unknown }[];
      response_format: { type: string };
    };
    expect(body.model).toBe('deepseek-v4-flash');
    expect(body.response_format.type).toBe('json_object');
    expect(body.messages[0]?.content).toBe('the prompt');
  });

  it('sends the photo as a data-URL image part on image calls', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(okResponse('{"ok":true}')));
    vi.stubGlobal('fetch', fetchMock);

    await buildAdapter().generateFromImageStream('describe', image, { models: ['m'] });

    const { init } = lastFetchCall(fetchMock);
    const body = JSON.parse(init.body as string) as {
      messages: { content: { type: string; image_url?: { url: string } }[] }[];
    };
    const parts = body.messages[0]?.content ?? [];
    expect(parts[0]).toEqual({ type: 'text', text: 'describe' });
    expect(parts[1]?.image_url?.url).toBe('data:image/jpeg;base64,aW1n');
  });

  it('maps HTTP 429 to the typed rate-limit error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('', { status: 429 }))),
    );

    await expect(
      buildAdapter().generateFromTextStream('p', { models: ['m'] }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.AiRateLimited });
  });

  it('maps a 5xx to AI_PROVIDER_UNAVAILABLE', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('', { status: 503 }))),
    );

    await expect(
      buildAdapter().generateFromTextStream('p', { models: ['m'] }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.AiProviderUnavailable });
  });

  it('rejects empty content as AI_RESPONSE_INVALID', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(okResponse(' '.repeat(3)))),
    );

    await expect(
      buildAdapter().generateFromTextStream('p', { models: ['m'] }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.AiResponseInvalid });
  });

  it('rejects content that fails the caller validation as AI_RESPONSE_INVALID', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(okResponse('not json'))),
    );

    await expect(
      buildAdapter().generateFromTextStream('p', {
        models: ['m'],
        validate: () => ({ ok: false, reason: 'not valid JSON' }),
      }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.AiResponseInvalid });
  });

  it('maps a network failure to AI_PROVIDER_UNAVAILABLE', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('socket hang up'))),
    );

    await expect(
      buildAdapter().generateFromTextStream('p', { models: ['m'] }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.AiProviderUnavailable });
  });

  it('fails when the router did not pin a model', async () => {
    vi.stubGlobal('fetch', vi.fn());

    await expect(buildAdapter().generateFromTextStream('p', {})).rejects.toMatchObject({
      errorCode: ErrorCode.AiProviderUnavailable,
    });
  });
});
