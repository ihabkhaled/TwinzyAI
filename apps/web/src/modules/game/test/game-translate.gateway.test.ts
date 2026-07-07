import { describe, expect, it, vi } from 'vitest';

import * as axiosPackage from '@/packages/axios';

import { translateResultRequest } from '../gateway/game-translate.gateway';
import {
  AI_TRANSLATE_REQUEST_TIMEOUT_MS,
  GAME_TRANSLATE_RESULT_PATH,
} from '../model/game.constants';

import { buildFinalResult } from './game-fixtures';

vi.mock('@/packages/axios', async (importActual) => {
  const actual = await importActual<typeof axiosPackage>();
  return { ...actual, postJson: vi.fn() };
});

const postJsonMock = vi.mocked(axiosPackage.postJson);

describe('translateResultRequest', () => {
  it('posts the existing result through postJson with a generous AI timeout', async () => {
    const original = buildFinalResult();
    const translated = buildFinalResult({ languageCode: 'ar' });
    postJsonMock.mockResolvedValue(translated);

    await expect(translateResultRequest(original, 'ar')).resolves.toEqual(translated);

    expect(postJsonMock).toHaveBeenCalledTimes(1);
    const call = postJsonMock.mock.calls[0];
    expect(call?.[1]).toBe(GAME_TRANSLATE_RESULT_PATH);
    expect(call?.[2]).toEqual({ targetLanguageCode: 'ar', result: original });
    // Real Gemini translation takes 13–25s; the request MUST override the 15s
    // shared client default or every slow generation aborts mid-flight.
    expect(call?.[4]).toEqual({ timeout: AI_TRANSLATE_REQUEST_TIMEOUT_MS });
    expect(AI_TRANSLATE_REQUEST_TIMEOUT_MS).toBeGreaterThan(15_000);
  });
});
