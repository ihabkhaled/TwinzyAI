import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as axiosPackage from '@/packages/axios';
import * as browserPackage from '@/packages/browser';
import { AppQueryClient, AppQueryClientProvider } from '@/packages/query';

import { useShareCreate } from '../hooks/useShareCreate.hook';

import { buildFinalResult } from './game-fixtures';

vi.mock('@/packages/axios', async (importActual) => {
  const actual = await importActual<typeof axiosPackage>();
  return { ...actual, postJson: vi.fn() };
});
vi.mock('@/packages/browser', async (importActual) => {
  const actual = await importActual<typeof browserPackage>();
  return {
    ...actual,
    canUseWebShare: vi.fn(() => true),
    copyTextToClipboard: vi.fn(() => Promise.resolve(true)),
    shareViaWebShare: vi.fn(() => Promise.resolve(true)),
  };
});

const postJsonMock = vi.mocked(axiosPackage.postJson);
const copyMock = vi.mocked(browserPackage.copyTextToClipboard);
const shareMock = vi.mocked(browserPackage.shareViaWebShare);

const SHARE_URL = 'https://twinzy.app/share/3f1c8b2a-9d4e-4c7a-8b1f-2e6a7c9d0e5b';
const SECOND_SHARE_URL = 'https://twinzy.app/share/4f1c8b2a-9d4e-4c7a-8b1f-2e6a7c9d0e5c';

const Wrapper = ({ children }: { children: ReactNode }): ReactElement => (
  <AppQueryClientProvider
    client={new AppQueryClient({ defaultOptions: { mutations: { retry: false } } })}
  >
    {children}
  </AppQueryClientProvider>
);

describe('useShareCreate', () => {
  beforeEach(() => {
    postJsonMock.mockReset();
    copyMock.mockClear();
    shareMock.mockClear();
  });

  it('creates a temporary link on open — posting only the result, never the image', async () => {
    postJsonMock.mockResolvedValue({ shareUrl: SHARE_URL });
    const { result } = renderHook(() => useShareCreate(buildFinalResult(), 'text'), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.open();
    });

    await waitFor(() => {
      expect(result.current.shareUrl).toBe(SHARE_URL);
    });
    expect(result.current.isOpen).toBe(true);
    const body = postJsonMock.mock.calls[0]?.[2];
    expect(JSON.stringify(body)).not.toMatch(/data:image|;base64,/iu);
  });

  it('copies the link and reports success feedback', async () => {
    postJsonMock.mockResolvedValue({ shareUrl: SHARE_URL });
    const { result } = renderHook(() => useShareCreate(buildFinalResult(), 'text'), {
      wrapper: Wrapper,
    });
    act(() => {
      result.current.open();
    });
    await waitFor(() => {
      expect(result.current.shareUrl).toBe(SHARE_URL);
    });

    act(() => {
      result.current.copyLink();
    });
    await waitFor(() => {
      expect(result.current.copyFeedbackKey).toBe('share.copySuccess');
    });
    expect(copyMock).toHaveBeenCalledWith(SHARE_URL);
  });

  it('invokes the native Web Share sheet with the URL only (no image)', async () => {
    postJsonMock.mockResolvedValue({ shareUrl: SHARE_URL });
    const { result } = renderHook(() => useShareCreate(buildFinalResult(), 'my text'), {
      wrapper: Wrapper,
    });
    act(() => {
      result.current.open();
    });
    await waitFor(() => {
      expect(result.current.shareUrl).toBe(SHARE_URL);
    });

    act(() => {
      result.current.nativeShare();
    });
    expect(shareMock).toHaveBeenCalledWith({ text: 'my text', url: SHARE_URL });
  });

  it('surfaces a failure key when creating the link fails', async () => {
    postJsonMock.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useShareCreate(buildFinalResult(), 'text'), {
      wrapper: Wrapper,
    });
    act(() => {
      result.current.open();
    });
    await waitFor(() => {
      expect(result.current.errorKey).toBe('share.createFailed');
    });
    expect(result.current.shareUrl).toBeUndefined();
  });

  it('does not open or create without a result', () => {
    const { result } = renderHook(() => useShareCreate(undefined, 'text'), { wrapper: Wrapper });

    act(() => {
      result.current.open();
      result.current.copyLink();
      result.current.nativeShare();
    });

    expect(result.current.isOpen).toBe(false);
    expect(postJsonMock).not.toHaveBeenCalled();
    expect(copyMock).not.toHaveBeenCalled();
    expect(shareMock).not.toHaveBeenCalled();
  });

  it('reuses the current result link and reports copy failure', async () => {
    postJsonMock.mockResolvedValue({ shareUrl: SHARE_URL });
    copyMock.mockResolvedValue(false);
    const { result } = renderHook(() => useShareCreate(buildFinalResult(), 'text'), {
      wrapper: Wrapper,
    });
    act(() => {
      result.current.open();
    });
    await waitFor(() => {
      expect(result.current.shareUrl).toBe(SHARE_URL);
    });

    act(() => {
      result.current.close();
      result.current.open();
      result.current.copyLink();
    });
    await waitFor(() => {
      expect(result.current.copyFeedbackKey).toBe('share.copyFailed');
    });
    expect(postJsonMock).toHaveBeenCalledTimes(1);
  });

  it('drops the old link when the result changes', async () => {
    postJsonMock
      .mockResolvedValueOnce({ shareUrl: SHARE_URL })
      .mockResolvedValueOnce({ shareUrl: SECOND_SHARE_URL });
    const first = buildFinalResult();
    const second = buildFinalResult({ languageCode: 'ar' });
    const { result, rerender } = renderHook(
      ({ currentResult }) => useShareCreate(currentResult, 'text'),
      { wrapper: Wrapper, initialProps: { currentResult: first } },
    );
    act(() => {
      result.current.open();
    });
    await waitFor(() => {
      expect(result.current.shareUrl).toBe(SHARE_URL);
    });

    rerender({ currentResult: second });
    await waitFor(() => {
      expect(result.current.shareUrl).toBeUndefined();
    });
    act(() => {
      result.current.open();
    });
    await waitFor(() => {
      expect(result.current.shareUrl).toBe(SECOND_SHARE_URL);
    });
    expect(postJsonMock).toHaveBeenCalledTimes(2);
  });
});
