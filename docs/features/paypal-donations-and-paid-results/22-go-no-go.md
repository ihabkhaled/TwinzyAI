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

**NO-GO** (2026-07-10). The specified mechanism (paypal.me link) cannot verify payment, so
it cannot gate results without deceiving users and risking real money on an honor-system
check. Conditions to reopen (all owner-provided):

1. PayPal **Business** REST credentials (sandbox + live), delivered as server-side secrets.
2. A deployed public **HTTPS** origin able to receive signature-verified PayPal webhooks.
3. Owner sign-off on adding a **durable order store** (reverses the recorded
   no-persistence architecture) and on revising the "free / anonymous / no persistence"
   consent + privacy + disclaimer copy in both languages.
4. The program then runs as its own full-SDLC delivery (threat model, sandbox E2E evidence,
   pentest of the order flow) before any live credential is configured.

Decision owner: repository owner. Recorded by: engineering (AI-assisted), same stream.
