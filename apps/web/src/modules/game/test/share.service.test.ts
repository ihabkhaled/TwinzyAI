import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as shareGateway from '../gateway/share.gateway';
import { createShareLink, fetchSharedResult } from '../services/share.service';

import { buildFinalResult } from './game-fixtures';

vi.mock('../gateway/share.gateway', () => ({
  createShareResultRequest: vi.fn(),
  getShareResultRequest: vi.fn(),
}));

describe('share service', () => {
  beforeEach(() => {
    vi.mocked(shareGateway.createShareResultRequest).mockReset();
    vi.mocked(shareGateway.getShareResultRequest).mockReset();
  });

  it('delegates create and read operations to the typed gateway', async () => {
    const result = buildFinalResult();
    const created = {
      shareId: '3f1c8b2a-9d4e-4c7a-8b1f-2e6a7c9d0e5b',
      shareUrl: 'https://twinzy.test/share/id',
      createdAt: '2026-07-10T00:00:00.000Z',
      expiresAt: '2026-07-10T00:10:00.000Z',
      ttlSeconds: 600,
    };
    vi.mocked(shareGateway.createShareResultRequest).mockResolvedValue(created);
    vi.mocked(shareGateway.getShareResultRequest).mockResolvedValue({
      ...created,
      languageCode: 'en',
      result,
      remainingSeconds: 600,
    });

    await expect(createShareLink(result)).resolves.toBe(created);
    await expect(fetchSharedResult(created.shareId)).resolves.toMatchObject({ result });
  });
});
