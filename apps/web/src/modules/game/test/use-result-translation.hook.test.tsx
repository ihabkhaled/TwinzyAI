import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as axiosPackage from '@/packages/axios';
import * as i18nPackage from '@/packages/i18n';
import { AppQueryClient, AppQueryClientProvider } from '@/packages/query';

import { useResultTranslation } from '../hooks/useResultTranslation.hook';

import { buildFinalResult } from './game-fixtures';

vi.mock('@/packages/i18n', async (importActual) => ({
  ...(await importActual<typeof i18nPackage>()),
  useAppLocale: vi.fn(),
}));
vi.mock('@/packages/axios', async (importActual) => {
  const actual = await importActual<typeof axiosPackage>();
  return { ...actual, postJson: vi.fn(), streamMultipart: vi.fn(), postMultipart: vi.fn() };
});

const localeMock = vi.mocked(i18nPackage.useAppLocale);
const postJsonMock = vi.mocked(axiosPackage.postJson);
const streamMultipartMock = vi.mocked(axiosPackage.streamMultipart);

const Wrapper = ({ children }: { children: ReactNode }): ReactElement => (
  <AppQueryClientProvider
    client={
      new AppQueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      })
    }
  >
    {children}
  </AppQueryClientProvider>
);

describe('useResultTranslation', () => {
  beforeEach(() => {
    localeMock.mockReturnValue('en');
    postJsonMock.mockReset();
    streamMultipartMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the canonical result untouched while the locale matches', () => {
    const canonical = buildFinalResult();
    const { result } = renderHook(() => useResultTranslation(canonical), { wrapper: Wrapper });

    expect(result.current.displayResult).toBe(canonical);
    expect(result.current.isTranslating).toBe(false);
    expect(postJsonMock).not.toHaveBeenCalled();
  });

  it('translates via the TEXT-ONLY endpoint on locale switch — never re-analyzing the image', async () => {
    const canonical = buildFinalResult();
    const translated = buildFinalResult({ languageCode: 'ar' });
    postJsonMock.mockResolvedValue(translated);
    localeMock.mockReturnValue('ar');

    const { result } = renderHook(() => useResultTranslation(canonical), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.displayResult).toBe(translated);
    });
    // The switch used the JSON translate endpoint exactly once…
    expect(postJsonMock).toHaveBeenCalledTimes(1);
    // …and NEVER re-opened the image analyze stream (no re-upload, no re-analysis).
    expect(streamMultipartMock).not.toHaveBeenCalled();
    // Names/scores/ranks preserved on what the UI displays.
    expect(result.current.displayResult?.results[0]?.name).toBe(canonical.results[0]?.name);
    expect(result.current.displayResult?.results[0]?.finalStyleVibeFitScore).toBe(
      canonical.results[0]?.finalStyleVibeFitScore,
    );
    expect(result.current.displayResult?.results[0]?.rank).toBe(canonical.results[0]?.rank);
  });

  it('keeps the previous result visible with an error key when translation fails', async () => {
    const canonical = buildFinalResult();
    postJsonMock.mockRejectedValue(new Error('offline'));
    localeMock.mockReturnValue('ar');

    const { result } = renderHook(() => useResultTranslation(canonical), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.errorKey).toBe('errors.translationFailed');
    });
    expect(result.current.displayResult).toBe(canonical);
    // Failed locale is not AUTO-retried in a loop (would hammer a rate-limited API).
    expect(postJsonMock).toHaveBeenCalledTimes(1);
  });

  it('re-attempts a previously-failed locale when the user retries, and succeeds', async () => {
    const canonical = buildFinalResult();
    const translated = buildFinalResult({ languageCode: 'ar' });
    // First attempt fails (e.g. transient quota/timeout); the retry succeeds.
    postJsonMock.mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce(translated);
    localeMock.mockReturnValue('ar');

    const { result } = renderHook(() => useResultTranslation(canonical), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.errorKey).toBe('errors.translationFailed');
    });
    expect(postJsonMock).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.displayResult).toBe(translated);
    });
    expect(result.current.errorKey).toBeUndefined();
    expect(postJsonMock).toHaveBeenCalledTimes(2);
    // Retrying the text endpoint still never re-analyzes the image.
    expect(streamMultipartMock).not.toHaveBeenCalled();
  });
});
