# 22 - Go / No-Go

## Workstream A — voluntary donations link

**GO** (2026-07-10). Evidence in `15-dev-validation-report.md`-equivalent below:

- Unit: env-schema hostile-handle suite, URL-builder hostile-handle suite, container
  hidden/rendered + attribute assertions (`donate-link.helper.test.ts`,
  `donate-link.container.test.tsx`, `public-env.test.ts`).
- E2E (`donations.spec.ts`, chromium + mobile-chromium projects; the axe a11y suite covers
  the result page containing the link): result fully visible without donate interaction;
  link href/target/rel/text asserted against the env-injected handle.
- Gates at commit time: typecheck 0 · lint 0 errors · unit suite green · integration green ·
  `test:e2e:ci` green · build green.
- Rollback: revert the commit, or set `NEXT_PUBLIC_PAYPAL_ME_USERNAME=` (empty) — the link
  disappears with no other behavior change (env-only rollback).

## Workstream B — $0.50 pre-result paywall

**Superseded (2026-07-12): the paypal.me mechanism NO-GO stands, but the owner provided
PayPal REST credentials, so the paywall was rebuilt on the PayPal Checkout gateway (Orders
v2) instead — the honest mechanism from `06-technical-refinement.md`. Status: SANDBOX-GO,
LIVE-conditional.**

The paypal.me link still cannot gate results (payment is unverifiable), and nothing in the
codebase uses it for gating. The shipped paywall uses server-side order creation +
capture-at-consumption + verified capture + auto-refund, which the code path only activates
when PayPal credentials are configured:

- **Enablement**: `PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET` present ⇒ paid gate ON;
  absent ⇒ the game is free and no payment code runs (default; every existing test + the
  free e2e flow prove this).
- **Capture-at-consumption** removes the durable-order-store blocker: PayPal is the ledger
  and captures each order exactly once, so a replay fails `ORDER_ALREADY_CAPTURED` — no
  local persistence is added, keeping the no-persistence architecture intact.
- **Verified live against the PayPal sandbox** (`25-sandbox-verification.md`): OAuth 200,
  order created at the server price, and capture-without-approval rejected 422
  `ORDER_NOT_APPROVED` — proving money cannot move without buyer approval.

**SANDBOX-GO** now (credentials in the gitignored `.env`, `PAYPAL_ENV=sandbox`). Remaining
conditions before **LIVE**:

1. A deployed public **HTTPS** origin (for the app; PayPal webhooks are an optional
   reconciliation hardening, not required for the capture-at-consumption correctness).
2. Upgrade to a PayPal **Business** account for live credentials; set `PAYPAL_ENV=live`
   only after sandbox sign-off.
3. Owner sign-off on the **consent + privacy + disclaimer copy revision**: the app still
   states "free / anonymous / no persistence"; with the paywall ON that copy must be
   updated (payment records are processed by PayPal even though we store none), in both
   languages, before charging real users.
4. A short live smoke test (one real $0.50 order end-to-end, then refund) recorded here.

Decision owner: repository owner. Recorded by: engineering (AI-assisted), same stream.
