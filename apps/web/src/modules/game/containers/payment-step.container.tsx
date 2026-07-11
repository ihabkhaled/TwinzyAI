'use client';
// client-boundary-reason: hosts the PayPal Buttons SDK via a browser-only ref lifecycle.

import type { ReactElement } from 'react';

import { Alert, Button, Card, Stack } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import { usePayPalButtons } from '../hooks/usePayPalButtons.hook';
import type { PaymentStepProps } from '../model/payment.types';

import { paymentDescriptionClass, paymentTitleClass } from './payment-step.variants';

/**
 * The paid-analysis step: a short explanation, the PayPal buttons (mounted by
 * the SDK into the ref), a recoverable error alert, and a cancel action back to
 * setup. The result stays hidden until the backend captures — this step only
 * collects the buyer's approval. Rendered only when the paywall is configured.
 */
export const PaymentStep = ({
  title,
  description,
  cancelLabel,
  errorMessage,
  payment,
}: Readonly<PaymentStepProps>): ReactElement => {
  const { containerRef } = usePayPalButtons({
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
        <div ref={containerRef} data-testid={TEST_IDS.paypalButtons} />
        <Button variant="ghost" onClick={payment.onCancel} testId={TEST_IDS.cancelPayment}>
          {cancelLabel}
        </Button>
      </Stack>
    </Card>
  );
};
