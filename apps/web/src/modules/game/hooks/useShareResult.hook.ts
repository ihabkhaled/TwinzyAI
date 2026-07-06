'use client';
// client-boundary-reason: writes to the clipboard and holds transient "copied" feedback state, both browser-only interactions.

import { useCallback, useState } from 'react';

import { copyTextToClipboard } from '@/packages/browser';

import { SHARE_COPIED_MESSAGE_KEY } from '../model/game.constants';
import type { ShareController } from '../model/game.types';

/**
 * Owns the share interaction: copies safe share text to the clipboard and
 * surfaces the "copied" feedback message key. Empty text is a no-op.
 */
export const useShareResult = (): ShareController => {
  const [feedbackKey, setFeedbackKey] = useState<string | undefined>();

  const onShare = useCallback(async (text: string): Promise<void> => {
    if (text.length === 0) {
      return;
    }
    const copied = await copyTextToClipboard(text);
    setFeedbackKey(copied ? SHARE_COPIED_MESSAGE_KEY : undefined);
  }, []);

  const resetFeedback = useCallback((): void => {
    setFeedbackKey(undefined);
  }, []);

  return { feedbackKey, onShare, resetFeedback };
};
