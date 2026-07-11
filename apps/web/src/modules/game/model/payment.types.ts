import type { RefObject } from 'react';

/** The ref the payment step attaches the PayPal buttons to. */
export interface PayPalButtonsController {
  containerRef: RefObject<HTMLDivElement | null>;
}

/** The paid-analysis sub-view: whether we are paying + the button callbacks. */
export interface PaymentViewModel {
  isPaywallEnabled: boolean;
  isPaying: boolean;
  priceLabel: string;
  createOrder: () => Promise<string>;
  onApprove: (orderId: string) => void;
  onCancel: () => void;
  onError: (error: unknown) => void;
}

/** Props for the payment step container. */
export interface PaymentStepProps {
  title: string;
  description: string;
  cancelLabel: string;
  errorMessage: string | undefined;
  payment: PaymentViewModel;
}
