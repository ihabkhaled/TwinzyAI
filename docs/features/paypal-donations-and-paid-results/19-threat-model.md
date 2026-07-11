# 19 - Threat Model: voluntary PayPal donate link

Scope: Workstream A only (the outbound link). Workstream B (paywall) has its own future
threat model as a gate of its program (`06-technical-refinement.md` §B item 6).

## Assets

- Users' trust that the game is free and un-gated (product-defining).
- The owner's PayPal handle (public by nature; not a secret).
- The integrity of the outbound URL (users must land on real PayPal, nowhere else).

## Trust boundaries

- Build-time env → client bundle (`NEXT_PUBLIC_PAYPAL_ME_USERNAME` is public config).
- Rendered page → PayPal (top-level navigation; no data leaves the app).

## Threats and mitigations

| Threat | Mitigation |
| --- | --- |
| Link injection: a hostile handle value rewrites the URL path/origin (`a/b`, `../`, `@evil`, `%2F`, unicode confusables) | Zod regex `^[A-Za-z0-9]{1,50}$` fails the build/boot; helper re-validates and throws before interpolating; scheme+host hardcoded (`https://paypal.me`). Unit tests enumerate hostile handles on both layers. |
| Tab-nabbing via `window.opener` | Shared `ExternalLink` primitive always sets `rel="noopener noreferrer"` + `target="_blank"`; e2e asserts the attributes. |
| Dark pattern: link implies payment is required | Copy is "(voluntary)" in en/ar; the e2e proves the full result (cards + disclaimer) renders before/without any donate interaction. |
| Feature-off misconfiguration renders a broken link | Unset/empty ⇒ container returns `null` (link absent), covered by unit test. Malformed ⇒ fail-fast at load, never a wrong link. |
| Phishing-style spoof of the PayPal origin | Origin is a compile-time constant; no user or backend input can reach it. |
| Privacy: donation adds tracking/PII | Nothing is logged, stored, or sent; it is an `<a href>`. Payment itself happens entirely on PayPal's site under PayPal's ToS. |
| CSP regression to allow PayPal | None needed: CSP `connect-src` governs fetch/XHR, not link navigation. No header was weakened. |

## Residual risk

- The handle is correct by assertion of the owner's directive; a typo would send donations
  to a wrong (or unregistered) handle. Mitigation: value lives in `.env` reviewed by the
  owner; example file ships empty.
- PayPal.me availability/regional restrictions are outside our control (link-out only).

Decision: residual risk accepted for a voluntary link. No high/critical findings open.
