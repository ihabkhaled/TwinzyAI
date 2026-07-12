'use client';
// client-boundary-reason: hosts the PayPal Buttons SDK via a browser-only ref lifecycle.

import type { ReactElement } from 'react';

import { Alert, Button, Card, Spinner, Stack } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import { usePayPalButtons } from '../hooks/usePayPalButtons.hook';
import type { PaymentStepProps } from '../model/payment.types';
import { PayPalButtonsStatus } from '../model/payment.types';

import {
  paymentButtonsClass,
  paymentDescriptionClass,
  paymentLoaderClass,
  paymentTitleClass,
} from './payment-step.variants';

/**
 * The paid-analysis step: a short explanation, a loader while the PayPal SDK
 * renders its buttons into the (always-mounted) container, a recoverable error
 * alert, and a cancel action back to setup. The result stays hidden until the
 * backend captures — this step only collects the buyer's approval. Rendered
 * only when the paywall is configured.
 */
export const PaymentStep = ({
  title,
  description,
  loadingLabel,
  cancelLabel,
  errorMessage,
  payment,
}: Readonly<PaymentStepProps>): ReactElement => {
  const { containerRef, status } = usePayPalButtons({
    createOrder: payment.createOrder,
    onApprove: payment.onApprove,
    onCancel: payment.onCancel,
    onError: payment.onError,
  });

  return (
    <Card testId={TEST_IDS.paymentStep}>
      <Stack gap="md">
        <h2 className={paymentTitleClass}>{title}</h2>
        <p className={paymentDescriptionClass}>{description}</p>
        {errorMessage === undefined ? null : <Alert tone="danger">{errorMessage}</Alert>}
        {status === PayPalButtonsStatus.Loading ? (
          <div className={paymentLoaderClass}>
            <Spinner label={loadingLabel} testId={TEST_IDS.paymentLoader} />
            <span className={paymentDescriptionClass}>{loadingLabel}</span>
          </div>
        ) : null}
        {/* Always mounted (white surface) so the SDK has a stable, readable node. */}
        <div
          ref={containerRef}
          className={paymentButtonsClass}
          data-testid={TEST_IDS.paypalButtons}
        />
        <Button variant="ghost" onClick={payment.onCancel} testId={TEST_IDS.cancelPayment}>
          {cancelLabel}
        </Button>
      </Stack>
    </Card>
  );
};
