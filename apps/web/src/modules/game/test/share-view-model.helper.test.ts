import { describe, expect, it, vi } from 'vitest';

import type { ShareResultResponse } from '@twinzy/shared';

import { resolveSharePhase } from '../helpers/share-display.helper';
import { buildShareModalViewModel } from '../helpers/share-view-model.helper';
import { SharePagePhase } from '../model/share.enums';
import type { ShareCreateController } from '../model/share.types';

import { buildFinalResult, fakeTranslate } from './game-fixtures';

const buildController = (
  overrides: Partial<ShareCreateController> = {},
): ShareCreateController => ({
  isOpen: true,
  isCreating: false,
  shareUrl: 'https://twinzy.test/share/id',
  errorKey: undefined,
  copyFeedbackKey: undefined,
  canNativeShare: true,
  open: vi.fn(),
  close: vi.fn(),
  copyLink: vi.fn(),
  nativeShare: vi.fn(),
  ...overrides,
});

const SHARE_DATA: ShareResultResponse = {
  shareId: '3f1c8b2a-9d4e-4c7a-8b1f-2e6a7c9d0e5b',
  languageCode: 'en',
  result: buildFinalResult(),
  createdAt: '2026-07-10T00:00:00.000Z',
  expiresAt: '2026-07-10T00:10:00.000Z',
  remainingSeconds: 600,
};

describe('buildShareModalViewModel', () => {
  it('translates feedback and builds platform links when a URL exists', () => {
    const view = buildShareModalViewModel(
      buildController({
        errorKey: 'share.createFailed',
        copyFeedbackKey: 'share.copySuccess',
      }),
      'share text',
      fakeTranslate,
    );

    expect(view.errorMessage).toBe('share.createFailed');
    expect(view.labels.copyFeedback).toBe('share.copySuccess');
    expect(view.platformLinks.length).toBeGreaterThan(0);
  });

  it('returns no links or optional messages before creation', () => {
    const view = buildShareModalViewModel(
      buildController({ shareUrl: undefined, errorKey: undefined, copyFeedbackKey: undefined }),
      'share text',
      fakeTranslate,
    );

    expect(view.platformLinks).toEqual([]);
    expect(view.errorMessage).toBeUndefined();
    expect(view.labels.copyFeedback).toBeUndefined();
  });
});

describe('resolveSharePhase', () => {
  it('prioritizes loading, not-found, expiry, then active', () => {
    expect(resolveSharePhase(true, false, undefined, false)).toBe(SharePagePhase.Loading);
    expect(resolveSharePhase(false, true, SHARE_DATA, false)).toBe(SharePagePhase.NotFound);
    expect(resolveSharePhase(false, false, undefined, false)).toBe(SharePagePhase.NotFound);
    expect(resolveSharePhase(false, false, SHARE_DATA, true)).toBe(SharePagePhase.Expired);
    expect(resolveSharePhase(false, false, SHARE_DATA, false)).toBe(SharePagePhase.Active);
  });
});
