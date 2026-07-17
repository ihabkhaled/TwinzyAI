import type { ReactElement } from 'react';

import { Alert, Button, Card, Stack } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import { PaymobOption } from '../components/paymob-option.component';
import type { PaymentStepProps } from '../model/payment.types';

import { paymentDescriptionClass, paymentTitleClass } from './payment-step.variants';
import { PaypalOption } from './paypal-option.container';

/**
 * The paid-analysis step: a short explanation, a recoverable error alert, and one
 * option per configured gateway — PayPal (wallet + card) and/or Paymob (EGP card)
 * — the buyer picks one. The result stays hidden until the backend proves payment
 * at consumption; this step only collects approval. Rendered only when a gateway
 * is configured.
 */
export const PaymentStep = ({
  title,
  description,
  loadingLabel,
  cancelLabel,
  paymobButtonLabel,
  errorMessage,
  payment,
}: Readonly<PaymentStepProps>): ReactElement => (
  <Card testId={TEST_IDS.paymentStep}>
    <Stack gap="md">
      <h2 className={paymentTitleClass}>{title}</h2>
      <p className={paymentDescriptionClass}>{description}</p>
      {errorMessage === undefined ? null : <Alert tone="danger">{errorMessage}</Alert>}
      {payment.isPaypalEnabled ? (
        <PaypalOption
          createOrder={payment.createOrder}
          onApprove={payment.onApprove}
          onCancel={payment.onCancel}
          onError={payment.onError}
          loadingLabel={loadingLabel}
        />
      ) : null}
      {payment.isPaymobEnabled ? (
        <PaymobOption
          label={paymobButtonLabel}
          isPending={payment.isPaymobPending}
          onPay={payment.payWithPaymob}
        />
      ) : null}
      <Button variant="ghost" onClick={payment.onCancel} testId={TEST_IDS.cancelPayment}>
        {cancelLabel}
      </Button>
    </Stack>
  </Card>
);
