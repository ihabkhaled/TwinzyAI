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

export { PAYMENT_ORDER_FIELD_NAME } from '@twinzy/shared';

/** Order/capture statuses the gate accepts as "money actually moved". */
export const PAYPAL_STATUS_COMPLETED = 'COMPLETED';

/** PayPal issue codes, referenced by the payment-failed set below. */
const PAYPAL_ISSUE_ORDER_NOT_APPROVED = 'ORDER_NOT_APPROVED';
const PAYPAL_ISSUE_ORDER_ALREADY_CAPTURED = 'ORDER_ALREADY_CAPTURED';

/**
 * Capture issues where NO money moved and the failure is on the payment side,
 * not our infrastructure — a declined/blocked instrument shows as a temporary
 * bank hold that is released (the "withdrawn then refunded" a payer sees), and
 * a compliance block simply cannot complete. These map to a 402 "not charged,
 * try again", never a 502 "provider unavailable" (which implies a transient
 * outage). COMPLIANCE_VIOLATION is usually an account/self-payment restriction
 * the payer must resolve with PayPal — see docs/features/…/06-technical-refinement.
 */
export const PAYPAL_PAYMENT_FAILED_ISSUES: readonly string[] = [
  PAYPAL_ISSUE_ORDER_NOT_APPROVED,
  PAYPAL_ISSUE_ORDER_ALREADY_CAPTURED,
  'INSTRUMENT_DECLINED',
  'PAYER_ACTION_REQUIRED',
  'TRANSACTION_REFUSED',
  'PAYER_CANNOT_PAY',
  'ORDER_NOT_CAPTURED',
  'ORDER_EXPIRED',
  'COMPLIANCE_VIOLATION',
];

/** Operator-facing error copy (safe: never echoes provider payloads). */
export const PAYMENT_REQUIRED_MESSAGE = 'This analysis requires payment before it can run.';
export const PAYMENT_ORDER_INVALID_MESSAGE =
  'The payment could not be verified for this request. Please approve the payment and try again.';
export const PAYMENT_UNAVAILABLE_MESSAGE =
  'The payment service is temporarily unavailable. Please try again shortly.';

// --- Paymob (card, EGP) ---
/** Route segment for the Paymob intention endpoint (under PAYMENTS_ROUTE_ROOT). */
export const PAYMENTS_ROUTE_PAYMOB_INTENTION = 'paymob/intention';

/** Paymob Accept REST paths (relative to PAYMOB_API_BASE_URL). */
export const PAYMOB_INTENTION_PATH = '/v1/intention/';
export const PAYMOB_AUTH_TOKEN_PATH = '/api/auth/tokens';
export const PAYMOB_TRANSACTION_INQUIRY_PATH = '/api/ecommerce/orders/transaction_inquiry/';
export const PAYMOB_REFUND_PATH = '/api/acceptance/void_refund/refund';

/** One Paymob call is bounded so a provider outage cannot hang a stream. */
export const PAYMOB_REQUEST_TIMEOUT_MS = 15_000;

/** Cache the api-key auth token this long (Paymob tokens live ~1h). */
export const PAYMOB_AUTH_TOKEN_TTL_MS = 3_000_000;

/** Line-item label shown on the Paymob checkout (no user data). */
export const PAYMOB_ITEM_NAME = 'Twinzy analysis';

/**
 * Placeholder billing data. The app deliberately collects NO personal data, so
 * every field is a non-identifying placeholder — Paymob requires the shape, not
 * real values, and nothing here is ever the user's information.
 */
export const PAYMOB_BILLING_PLACEHOLDER = {
  first_name: 'NA',
  last_name: 'NA',
  email: 'billing@twinzy.app',
  phone_number: 'NA',
  street: 'NA',
  building: 'NA',
  floor: 'NA',
  apartment: 'NA',
  city: 'NA',
  state: 'NA',
  country: 'NA',
} as const;

/** Minor units (piasters/cents) per one major currency unit. */
export const MINOR_UNITS_PER_MAJOR = 100;

/** The `result` value the USD rates endpoint returns on success. */
export const EXCHANGE_RATE_SUCCESS_RESULT = 'success';
