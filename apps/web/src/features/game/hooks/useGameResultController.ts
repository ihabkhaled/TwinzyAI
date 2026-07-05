'use client';

import { useCallback, useState } from 'react';

import { t } from '@/i18n';
import { ShareOutcome, shareText } from '@/lib/share';

export interface GameResultController {
  shareFeedback: string | undefined;
  onShare: (text: string) => Promise<void>;
  resetShareFeedback: () => void;
}

/**
 * Owns the share interaction: Web Share API with clipboard fallback,
 * plus the "copied" feedback message.
 */
export const useGameResultController = (): GameResultController => {
  const [shareFeedback, setShareFeedback] = useState<string | undefined>();

  const onShare = useCallback(async (text: string) => {
    if (text.length === 0) {
      return;
    }
    const outcome = await shareText(text);
    setShareFeedback(outcome === ShareOutcome.Copied ? t('game.shareCopied') : undefined);
  }, []);

  const resetShareFeedback = useCallback(() => {
    setShareFeedback(undefined);
  }, []);

  return { shareFeedback, onShare, resetShareFeedback };
};
