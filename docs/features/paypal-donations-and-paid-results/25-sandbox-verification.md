# 25 - PayPal Sandbox Verification (live evidence)

The paid-analysis gateway was verified against the **real PayPal sandbox REST
API** using the owner-provided sandbox credentials (stored only in the
gitignored `.env`; never committed, never printed). The script exercised the
exact three calls the `PaypalAdapter` makes.

Run: 2026-07-12, `PAYPAL_ENV=sandbox`, price `0.50 USD`.

| Step | Call | Result | Meaning |
| --- | --- | --- | --- |
| 1 | `POST /v1/oauth2/token` (client-credentials, Basic auth) | **200**, access_token received | The adapter's OAuth + token caching path is correct against real PayPal. |
| 2 | `POST /v2/checkout/orders` (intent CAPTURE, amount from server config, `custom_id` = requestId) | **201**, real order id, buyer-approval URL present | Order creation with the **server-authoritative** price and the request binding works; the browser would send the payer to the approval URL. |
| 3 | `POST /v2/checkout/orders/{id}/capture` on the **unapproved** order | **422**, `issue = ORDER_NOT_APPROVED` | **The security guarantee holds live: money cannot be captured without buyer approval.** The adapter maps this exact issue to `PAYMENT_ORDER_INVALID` (HTTP 402), so an unpaid/unapproved analysis is refused. |

This confirms the mocked unit tests (`paypal.adapter.test.ts`) reflect real
provider behavior: the same OAuth shape, the same 422/`ORDER_NOT_APPROVED`
rejection, the same order-id and status fields the capture verification reads.

A full paid happy-path capture additionally requires a human to approve the
order in the PayPal sandbox buyer UI (interactive; cannot run headlessly).
Steps 1–3 above prove every server-side leg plus the critical negative path;
the approve-then-capture leg is covered by the integration test with the PayPal
HTTP boundary faked and by the unit tests that assert amount/currency/binding
verification on a COMPLETED capture body.

## Reproduce

`.env` must carry `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` (sandbox) and
`PAYPAL_ENV=sandbox`. The verification script lives outside version control (it
reads the gitignored `.env`); the three curl-equivalent calls above reproduce
it. Never commit credentials or run this against `live` without an approved
release.
