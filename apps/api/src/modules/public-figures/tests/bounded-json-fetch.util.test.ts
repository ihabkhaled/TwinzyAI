import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchBoundedJson } from '../lib/bounded-json-fetch.util';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchBoundedJson', () => {
  it('uses no redirects and accepts bounded JSON only from allowlisted HTTPS sources', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response('{"ok":true}', {
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchBoundedJson('https://www.wikidata.org/wiki/test.json', 1000, 100),
    ).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://www.wikidata.org/wiki/test.json',
      expect.objectContaining({ redirect: 'error' }),
    );
  });

  it('rejects disallowed hosts and oversized declared responses before reading them', async () => {
    await expect(fetchBoundedJson('https://attacker.example/data.json', 1000, 100)).rejects.toThrow(
      'allowlisted',
    );

    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response('{"ok":true}', {
            headers: {
              'content-length': '1000',
              'content-type': 'application/json',
            },
          }),
        ),
      ),
    );
    await expect(
      fetchBoundedJson('https://www.wikidata.org/wiki/test.json', 1000, 100),
    ).rejects.toThrow('byte limit');
  });

  it.each([
    [
      'non-success status',
      new Response('{"error":true}', {
        status: 503,
        headers: { 'content-type': 'application/json' },
      }),
    ],
    [
      'non-JSON content',
      new Response('not json', {
        headers: { 'content-type': 'text/plain' },
      }),
    ],
  ])('rejects %s responses', async (_label, response) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(response)),
    );

    await expect(
      fetchBoundedJson('https://www.wikidata.org/wiki/test.json', 1000, 100),
    ).rejects.toThrow('invalid response');
  });

  it('rejects an oversized body when content length was not declared', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          Response.json(
            { value: 'x'.repeat(200) },
            {
              headers: { 'content-type': 'application/json' },
            },
          ),
        ),
      ),
    );

    await expect(
      fetchBoundedJson('https://www.wikidata.org/wiki/test.json', 1000, 100),
    ).rejects.toThrow('byte limit');
  });
});
