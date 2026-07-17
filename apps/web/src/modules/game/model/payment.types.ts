import type { RefObject } from 'react';

/** Lifecycle of the PayPal buttons: loading the SDK, rendered, or failed. */
export const PayPalButtonsStatus = {
  Loading: 'loading',
  Ready: 'ready',
  Error: 'error',
} as const;

export type PayPalButtonsStatusValue =
  (typeof PayPalButtonsStatus)[keyof typeof PayPalButtonsStatus];

/** The ref the payment step attaches the PayPal buttons to + their status. */
export interface PayPalButtonsController {
  containerRef: RefObject<HTMLDivElement | null>;
  status: PayPalButtonsStatusValue;
}

/** The paid-analysis sub-view: which gateways to show + the button callbacks. */
export interface PaymentViewModel {
  isPaywallEnabled: boolean;
  isPaypalEnabled: boolean;
  isPaymobEnabled: boolean;
  isPaying: boolean;
  isPaymobPending: boolean;
  createOrder: () => Promise<string>;
  onApprove: (orderId: string) => void;
  payWithPaymob: () => void;
  onCancel: () => void;
  onError: (error: unknown) => void;
}

/** Props for the payment step container. */
export interface PaymentStepProps {
  title: string;
  description: string;
  loadingLabel: string;
  cancelLabel: string;
  paymobButtonLabel: string;
  errorMessage: string | undefined;
  payment: PaymentViewModel;
}

/** Props for the PayPal option block (Buttons SDK mount + loader). */
export interface PaypalOptionProps {
  createOrder: () => Promise<string>;
  onApprove: (orderId: string) => void;
  onCancel: () => void;
  onError: (error: unknown) => void;
  loadingLabel: string;
}

/** Props for the Paymob card option (a button that opens the popup checkout). */
export interface PaymobOptionProps {
  label: string;
  isPending: boolean;
  onPay: () => void;
}
