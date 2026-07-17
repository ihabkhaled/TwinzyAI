'use client';
// client-boundary-reason: hosts the PayPal Buttons SDK via a browser-only ref lifecycle.

import type { ReactElement } from 'react';

import { Spinner } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import { usePayPalButtons } from '../hooks/usePayPalButtons.hook';
import type { PaypalOptionProps } from '../model/payment.types';
import { PayPalButtonsStatus } from '../model/payment.types';

import {
  paymentButtonsClass,
  paymentDescriptionClass,
  paymentLoaderClass,
} from './payment-step.variants';

/**
 * The PayPal gateway option: a loader while the Buttons SDK renders into the
 * (always-mounted, white-surface) container. Split out of {@link PaymentStep} so
 * the SDK lifecycle stays isolated and the step can compose it beside Paymob.
 */
export const PaypalOption = ({
  createOrder,
  onApprove,
  onCancel,
  onError,
  loadingLabel,
}: Readonly<PaypalOptionProps>): ReactElement => {
  const { containerRef, status } = usePayPalButtons({ createOrder, onApprove, onCancel, onError });

  return (
    <>
      {status === PayPalButtonsStatus.Loading ? (
        <div className={paymentLoaderClass}>
          <Spinner label={loadingLabel} testId={TEST_IDS.paymentLoader} />
          <span className={paymentDescriptionClass}>{loadingLabel}</span>
        </div>
      ) : null}
      <div
        ref={containerRef}
        className={paymentButtonsClass}
        data-testid={TEST_IDS.paypalButtons}
      />
    </>
  );
};
