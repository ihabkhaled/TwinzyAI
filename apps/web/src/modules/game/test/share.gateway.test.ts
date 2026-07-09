import { describe, expect, it, vi } from 'vitest';

import { SHARE_RESULTS_PATH } from '@twinzy/shared';

import * as axiosPackage from '@/packages/axios';

import { createShareResultRequest, getShareResultRequest } from '../gateway/share.gateway';

import { buildFinalResult } from './game-fixtures';

vi.mock('@/packages/axios', async (importActual) => {
  const actual = await importActual<typeof axiosPackage>();
  return { ...actual, postJson: vi.fn(), getJson: vi.fn() };
});

const postJsonMock = vi.mocked(axiosPackage.postJson);
const getJsonMock = vi.mocked(axiosPackage.getJson);

describe('createShareResultRequest', () => {
  it('posts ONLY the result (no image/file field) to the share path', async () => {
    const result = buildFinalResult();
    postJsonMock.mockResolvedValue({ shareId: 'x' });

    await createShareResultRequest(result);

    const call = postJsonMock.mock.calls[0];
    expect(call?.[1]).toBe(SHARE_RESULTS_PATH);
    expect(call?.[2]).toEqual({ result });
    expect(JSON.stringify(call?.[2])).not.toMatch(/data:image|;base64,/iu);
  });
});

describe('getShareResultRequest', () => {
  it('reads by a URL-encoded id under the share path', async () => {
    getJsonMock.mockResolvedValue({ shareId: 'x' });

    await getShareResultRequest('a/b?c');

    const call = getJsonMock.mock.calls[0];
    expect(call?.[1]).toBe(`${SHARE_RESULTS_PATH}/${encodeURIComponent('a/b?c')}`);
  });
});
