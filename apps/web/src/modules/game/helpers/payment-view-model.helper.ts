import type { PaymentViewModel } from '../model/payment.types';
import type { PaymentFlowController } from '../model/payment-flow.types';

/** Inputs the payment view model is assembled from (all prepared upstream). */
export interface PaymentViewModelInput {
  flow: PaymentFlowController;
  onError: (error: unknown) => void;
}

/**
 * Assemble the payment sub-view the container spreads into {@link PaymentStep}.
 * The button callbacks come straight from the flow; `onError` is the game
 * hook's payment-error setter so a failed order/approval surfaces recoverably.
 */
export const buildPaymentViewModel = ({
  flow,
  onError,
}: PaymentViewModelInput): PaymentViewModel => ({
  isPaywallEnabled: flow.isPaywallEnabled,
  isPaypalEnabled: flow.isPaypalEnabled,
  isPaymobEnabled: flow.isPaymobEnabled,
  isPaying: flow.isPaying,
  isPaymobPending: flow.isPaymobPending,
  createOrder: flow.createOrder,
  onApprove: flow.onApprove,
  payWithPaymob: flow.payWithPaymob,
  onCancel: flow.cancelPayment,
  onError,
});
