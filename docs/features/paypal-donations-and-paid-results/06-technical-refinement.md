# 06 - Technical Refinement: Why the paywall is blocked, and what the real one requires

## Workstream A — donations link (implemented)

Chosen approach: a pure outbound link.

- Env: `NEXT_PUBLIC_PAYPAL_ME_USERNAME`, zod-validated at module load against
  `^[A-Za-z0-9]{1,50}$` (`apps/web/src/packages/env/public-env.ts`). Empty/unset ⇒ feature
  off (link not rendered). Any character that could alter the URL path/origin (slash, dot,
  `@`, `%`, whitespace, non-ASCII) fails the build/boot — fail-fast, never a broken link.
- URL construction: `https://paypal.me/<handle>` with scheme+host hardcoded
  (`modules/game/model/donate.constants.ts`); the helper re-validates the handle before
  interpolating (defense in depth) and throws otherwise.
- Rendering: `DonateLink` container → shared `ExternalLink` primitive (`target="_blank"`,
  `rel="noopener noreferrer"`). i18n copy en/ar explicitly says "(voluntary)". Rendered on
  the game result actions row and the public share page. `TEST_IDS.donateLink`.
- No CSP change: CSP restricts fetch/XHR (`connect-src`), not top-level navigation links.
- No backend involvement, no persistence, no PII, no money handled ⇒ no PCI surface.

Rejected alternatives:
- PayPal Donate SDK/hosted button: pulls third-party script into a CSP-locked app for zero
  functional gain over a link; enlarges the supply-chain surface.
- Fixed-amount link (`paypal.me/<handle>/5USD`): donations stay payer-chosen; no amount
  math on our side.

## Workstream B — $0.50-per-request paywall: NO-GO as specified

**The requested mechanism cannot work.** `paypal.me/ihabkhaled94` is a consumer P2P link.
PayPal.me provides **no API, no webhook/IPN, no return-redirect proof, no reference field,
and no server-queryable record** tying a payment to a request. The backend can never learn
that *this* visitor paid for *this* analysis. Every possible "integration" degrades to an
honor-system "I paid" button — trivially bypassed, and worse for honest users: someone who
actually pays and then hits an error has no receipt binding, no reconciliation path, and no
refund trail. That is fake security around real money, which the owner's own directive
("people's money, transaction, privacy are not a testing lab") forbids. Refusing to ship it
IS the security requirement.

**The honest architecture** (recorded for when the owner green-lights it):

1. PayPal **Business** account + REST credentials (`PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET`,
   sandbox first) — server-side only, never `NEXT_PUBLIC_*`.
2. Orders v2 flow: server creates the order (amount/currency **server-authoritative**:
   `0.50 USD` from env-validated config, never client input), client approves via the PayPal
   JS SDK, server **captures** with an idempotency key, and a **webhook handler**
   (`PAYMENT.CAPTURE.COMPLETED`) verifies PayPal's transmission signature before trusting
   anything.
3. A **durable order store** with a state machine (`created → approved → captured →
   consumed`), one-time consumption binding `orderId ↔ requestId ↔ shareId` (this is the
   "payment connected to the shared URL" piece), replay/duplicate-capture rejection, and
   bounded TTLs for abandoned orders. In-memory storage is NOT acceptable for money: a
   restart must never lose a paid-but-unserved record.
4. A deployed **public HTTPS origin** (webhooks must reach it; HSTS + TLS termination at the
   proxy; secure/eTLD-scoped cookies for the payment session token).
5. Product/compliance rework: the app currently promises "free, anonymous, no persistence"
   in consent copy, disclaimers (en/ar), Swagger description, and privacy docs. Transaction
   records are retained personal data — privacy policy, retention windows, refund/dispute
   operations, and PayPal AUP review (paid AI photo analysis) must all be revised first.
6. Full SDLC per CLAUDE.md phases 00–27 including threat model, pentest of the order flow
   (forced-capture replay, amount tampering, webhook forgery, IDOR on order ids), and
   sandbox end-to-end evidence before any production credential exists in any environment.

**Why it is not implemented now:** items 1 and 4 are owner-only inputs that do not exist in
this repository (no business credentials, no deployed origin), and item 3 reverses the
recorded no-persistence architecture — an owner decision that must be made explicitly, not
smuggled in via a feature branch. Shipping unverifiable payment-capture code "ready for
credentials" would put real money on untested paths, violating the directive's own security
bar and the repo's Definition of Done (validation evidence must exist).

## Decision of record

- Donations: **GO** (this stream).
- Paywall: **NO-GO until** the owner provides PayPal Business sandbox+live credentials, a
  deployed HTTPS origin for webhooks, and approves the persistence + privacy-copy revisions
  above. The program then proceeds as its own phased delivery.
