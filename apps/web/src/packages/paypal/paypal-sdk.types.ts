/**
 * Minimal typed surface of the PayPal JS Buttons SDK we depend on. The SDK is
 * loaded lazily by the wrapper; the rest of the app depends only on these types
 * and the wrapper's functions, never on `window.paypal` directly.
 */

/** Actions PayPal passes to the button callbacks. */
export interface PayPalOrderActions {
  order: {
    capture: () => Promise<unknown>;
  };
}

/** The subset of PayPal Buttons options the payment step configures. */
export interface PayPalButtonsConfig {
  /** Ask our backend to create the server-priced order; return its id. */
  createOrder: () => Promise<string>;
  /** Buyer approved in the PayPal UI; the order id is echoed back. */
  onApprove: (orderId: string) => Promise<void> | void;
  /** Buyer dismissed the PayPal window without paying. */
  onCancel?: () => void;
  /** SDK or network error while rendering/approving. */
  onError?: (error: unknown) => void;
}

/** Handle returned by {@link renderPayPalButtons} for teardown. */
export interface PayPalButtonsHandle {
  close: () => void;
}
