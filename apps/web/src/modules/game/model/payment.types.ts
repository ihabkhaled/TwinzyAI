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

/** The paid-analysis sub-view: whether we are paying + the button callbacks. */
export interface PaymentViewModel {
  isPaywallEnabled: boolean;
  isPaying: boolean;
  createOrder: () => Promise<string>;
  onApprove: (orderId: string) => void;
  onCancel: () => void;
  onError: (error: unknown) => void;
}

/** Props for the payment step container. */
export interface PaymentStepProps {
  title: string;
  description: string;
  loadingLabel: string;
  cancelLabel: string;
  errorMessage: string | undefined;
  payment: PaymentViewModel;
}
