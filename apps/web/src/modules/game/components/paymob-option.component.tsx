import type { ReactElement } from 'react';

import { Button } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import type { PaymobOptionProps } from '../model/payment.types';

/**
 * The Paymob (card, EGP) gateway option: one button that opens Paymob's hosted
 * checkout in a popup. Disabled while a checkout is already in flight so a buyer
 * cannot open two. Payment is verified server-side when the run starts.
 */
export function PaymobOption({
  label,
  isPending,
  onPay,
}: Readonly<PaymobOptionProps>): ReactElement {
  return (
    <Button
      variant="secondary"
      onClick={onPay}
      disabled={isPending}
      testId={TEST_IDS.paymobCardButton}
    >
      {label}
    </Button>
  );
}
