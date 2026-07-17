'use client';
// client-boundary-reason: reads the redirect query and postMessages the opener on mount, then auto-closes the popup (browser-only).

import type { ReactElement } from 'react';
import { useEffect } from 'react';

import { useAppTranslation } from '@/packages/i18n';
import { relayPaymobReturn } from '@/packages/paymob';
import { Spinner, Stack } from '@/packages/ui-primitives';

/**
 * The page the Paymob checkout popup lands on after payment. On mount it relays
 * the transaction id back to the opener (the main app) and closes itself, so the
 * buyer never has to close the window by hand. Nothing here is trusted: the
 * opener re-verifies the payment with Paymob server-side before delivering.
 */
export function PaymobReturnContainer(): ReactElement {
  const t = useAppTranslation();

  useEffect(() => {
    relayPaymobReturn();
  }, []);

  return (
    <Stack align="center" justify="center" gap="md">
      <Spinner label={t('game.paymobReturnMessage')} />
    </Stack>
  );
}
