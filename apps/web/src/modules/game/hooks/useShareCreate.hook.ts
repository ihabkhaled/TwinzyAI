'use client';
// client-boundary-reason: owns modal open state, the create mutation, clipboard copy, and the native Web Share sheet — all browser-only interactions.

import { useCallback, useEffect, useState } from 'react';

import type { FinalGameResult } from '@twinzy/shared';

import { canUseWebShare, copyTextToClipboard, shareViaWebShare } from '@/packages/browser';

import { SHARE_MESSAGE_KEYS } from '../model/share.constants';
import type { ShareCreateController } from '../model/share.types';
import { useCreateShareMutation } from '../queries/share.mutations';

/**
 * Owns the "Share result" flow on the result screen: creating a temporary link
 * (never re-sending the image — only the existing result JSON), opening the
 * share modal, copying the link, and invoking the native Web Share sheet when
 * available. All raw i18n keys; the container translates them.
 */
export const useShareCreate = (
  result: FinalGameResult | undefined,
  shareText: string,
): ShareCreateController => {
  const [isOpen, setIsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | undefined>();
  const [errorKey, setErrorKey] = useState<string | undefined>();
  const [copyFeedbackKey, setCopyFeedbackKey] = useState<string | undefined>();
  const mutation = useCreateShareMutation();
  const resetMutation = mutation.reset;
  const resultFingerprint = result === undefined ? undefined : JSON.stringify(result);

  useEffect(() => {
    setIsOpen(false);
    setShareUrl(undefined);
    setErrorKey(undefined);
    setCopyFeedbackKey(undefined);
    resetMutation();
  }, [resultFingerprint, resetMutation]);

  const open = useCallback((): void => {
    if (result === undefined) {
      return;
    }
    setIsOpen(true);
    setErrorKey(undefined);
    setCopyFeedbackKey(undefined);
    if (shareUrl !== undefined) {
      return;
    }
    mutation.create(result, {
      onSuccess: (data): void => {
        setShareUrl(data.shareUrl);
      },
      onError: (): void => {
        setErrorKey(SHARE_MESSAGE_KEYS.createFailed);
      },
    });
  }, [result, shareUrl, mutation]);

  const close = useCallback((): void => {
    setIsOpen(false);
  }, []);

  const copyLink = useCallback((): void => {
    if (shareUrl === undefined) {
      return;
    }
    void (async (): Promise<void> => {
      const copied = await copyTextToClipboard(shareUrl);
      setCopyFeedbackKey(copied ? SHARE_MESSAGE_KEYS.copySuccess : SHARE_MESSAGE_KEYS.copyFailed);
    })();
  }, [shareUrl]);

  const nativeShare = useCallback((): void => {
    if (shareUrl === undefined) {
      return;
    }
    void shareViaWebShare({ text: shareText, url: shareUrl });
  }, [shareUrl, shareText]);

  return {
    isOpen,
    isCreating: mutation.isPending,
    shareUrl,
    errorKey,
    copyFeedbackKey,
    canNativeShare: canUseWebShare(),
    open,
    close,
    copyLink,
    nativeShare,
  };
};
