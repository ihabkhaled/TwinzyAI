'use client';
// client-boundary-reason: watches the active locale and swaps the displayed result to its translation via the text-only endpoint, entirely in browser state.

import { useCallback, useEffect, useState } from 'react';

import type { FinalGameResult } from '@twinzy/shared';
import { isSupportedLanguageCode } from '@twinzy/shared';

import { useAppLocale } from '@/packages/i18n';

import { TRANSLATION_FAILED_MESSAGE_KEY } from '../model/game.constants';
import type { ResultTranslationController } from '../model/game.types';
import { useTranslateResultMutation } from '../queries/game.mutations';

/**
 * Language-switch controller for an existing result. When the active locale
 * differs from the displayed result's language, it calls the TEXT-ONLY
 * translate endpoint — never re-uploading or re-analyzing the image — and
 * swaps in the localized result on success. On failure the previous result
 * stays visible with a localized error; the failed locale is not AUTO-retried
 * (that would hammer a rate-limited API), but {@link ResultTranslationController.retry}
 * lets the user re-attempt the same locale on demand — the common recovery for
 * a transient timeout or quota hit. A new canonical result clears everything.
 */
export const useResultTranslation = (
  canonical: FinalGameResult | undefined,
): ResultTranslationController => {
  const rawLocale = useAppLocale();
  const [translated, setTranslated] = useState<FinalGameResult | undefined>();
  const [failedLanguage, setFailedLanguage] = useState<string | undefined>();
  const { isPending, translate } = useTranslateResultMutation();

  // A fresh analyze result invalidates any previous translation state.
  useEffect(() => {
    setTranslated(undefined);
    setFailedLanguage(undefined);
  }, [canonical]);

  const displayResult = translated ?? canonical;

  useEffect(() => {
    if (
      displayResult === undefined ||
      isPending ||
      !isSupportedLanguageCode(rawLocale) ||
      rawLocale === displayResult.languageCode ||
      rawLocale === failedLanguage
    ) {
      return;
    }
    translate(
      { result: displayResult, targetLanguageCode: rawLocale },
      {
        onSuccess: (next): void => {
          setTranslated(next);
          setFailedLanguage(undefined);
        },
        onError: (): void => {
          setFailedLanguage(rawLocale);
        },
      },
    );
  }, [displayResult, failedLanguage, isPending, rawLocale, translate]);

  // Clearing the failed-locale guard re-arms the effect above for the current
  // locale, so the user's explicit retry re-issues the text-only translate.
  const retry = useCallback((): void => {
    setFailedLanguage(undefined);
  }, []);

  return {
    displayResult,
    isTranslating: isPending,
    errorKey: failedLanguage === undefined ? undefined : TRANSLATION_FAILED_MESSAGE_KEY,
    retry,
  };
};
