import { TextDecoder } from 'node:util';

import { assertAllowedPublicFigureUrl } from './public-figure-url.util';

const JSON_CONTENT_TYPE = 'application/json';

const readBoundedText = async (response: Response, maxBytes: number): Promise<string> => {
  const declaredBytes = Number(response.headers.get('content-length') ?? 0);
  if (declaredBytes > maxBytes) {
    throw new Error('Public-figure response exceeded the byte limit');
  }
  const body = await response.arrayBuffer();
  if (body.byteLength > maxBytes) {
    throw new Error('Public-figure response exceeded the byte limit');
  }
  const decoder = new TextDecoder();
  return decoder.decode(body);
};

export const fetchBoundedJson = async (
  url: string,
  timeoutMs: number,
  maxBytes: number,
): Promise<unknown> => {
  const safeUrl = assertAllowedPublicFigureUrl(url);
  const response = await globalThis.fetch(safeUrl, {
    headers: { accept: JSON_CONTENT_TYPE },
    redirect: 'error',
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok || !response.headers.get('content-type')?.includes(JSON_CONTENT_TYPE)) {
    throw new Error('Public-figure source returned an invalid response');
  }
  return JSON.parse(await readBoundedText(response, maxBytes));
};
