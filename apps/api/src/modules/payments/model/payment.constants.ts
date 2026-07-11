/** Route segments of the payments API (composed in bootstrap body limits too). */
export const PAYMENTS_ROUTE_ROOT = 'payments';
export const PAYMENTS_ROUTE_ORDERS = 'orders';

/**
 * Order creation is cheap but hits PayPal — bounded per client so the
 * endpoint cannot be used to spray orders at the provider.
 */
export const CREATE_ORDER_THROTTLE = {
  default: { limit: 10, ttl: 60_000 },
} as const;

/** PayPal REST paths used by the adapter (relative to the env base URL). */
export const PAYPAL_OAUTH_TOKEN_PATH = '/v1/oauth2/token';
export const PAYPAL_ORDERS_PATH = '/v2/checkout/orders';
export const PAYPAL_CAPTURES_PATH = '/v2/payments/captures';

/** Bound on one PayPal call; payments must fail fast, not hang a stream. */
export const PAYPAL_REQUEST_TIMEOUT_MS = 15_000;

/** Refresh the cached OAuth token this long before PayPal expires it. */
export const PAYPAL_TOKEN_EXPIRY_MARGIN_SECONDS = 60;

/** Milliseconds per second (PayPal reports token lifetime in seconds). */
export const MILLISECONDS_PER_SECOND = 1000;

/** HTTP 404 from an order/capture call means the order id is unknown. */
export const HTTP_STATUS_NOT_FOUND = 404;

/**
 * PayPal order ids as observed in the wild: short uppercase alphanumerics.
 * The bound is generous but strict enough that the multipart field can never
 * smuggle structured payloads toward the adapter.
 */
export const PAYPAL_ORDER_ID_PATTERN = /^[A-Z0-9-]{8,64}$/;

/** Multipart field on the analyze request carrying the approved order id. */
export const PAYMENT_ORDER_FIELD_NAME = 'paypalOrderId';

/** Order/capture statuses the gate accepts as "money actually moved". */
export const PAYPAL_STATUS_COMPLETED = 'COMPLETED';

/** PayPal issue codes the adapter maps to typed errors. */
export const PAYPAL_ISSUE_ORDER_NOT_APPROVED = 'ORDER_NOT_APPROVED';
export const PAYPAL_ISSUE_ORDER_ALREADY_CAPTURED = 'ORDER_ALREADY_CAPTURED';

/** Operator-facing error copy (safe: never echoes provider payloads). */
export const PAYMENT_REQUIRED_MESSAGE = 'This analysis requires payment before it can run.';
export const PAYMENT_ORDER_INVALID_MESSAGE =
  'The payment could not be verified for this request. Please approve the payment and try again.';
export const PAYMENT_UNAVAILABLE_MESSAGE =
  'The payment service is temporarily unavailable. Please try again shortly.';
