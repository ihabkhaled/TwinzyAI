# 00 - Intake: PayPal Donations (enacted) + Paid Results Paywall (blocked)

- Request ID: `paypal-donations-and-paid-results`
- Type: monetization policy revision + feature (owner directive, 2026-07-10, verbatim: PayPal payments and donations; env var for the PayPal username; $0.50 per request before showing results via `paypal.me/ihabkhaled94`; secure gateways; payment connected to the share URL; full validation both sides)
- Source: repository owner (the paypal.me handle names the owner: "this is me")
- Owners: Engineering (AI-assisted); business owner = repository owner
- Severity/urgency: high (money-handling request); standard track
- Critical-risk flags: **money flow**, privacy, compliance, user trust, external integration
- Delivery track split (decision of record):
  - **Workstream A — voluntary donations link: GO, implemented in this stream.**
  - **Workstream B — $0.50 pre-result paywall: NO-GO as specified; blocked on owner inputs.** See `06-technical-refinement.md` and `22-go-no-go.md`.

## Scope statement

A. Add a voluntary, clearly-labeled "Support Twinzy on PayPal" outbound link on the result
screen and the public share page. Handle comes from `NEXT_PUBLIC_PAYPAL_ME_USERNAME`
(strictly validated alphanumeric, 1–50 chars; unset/empty hides the link). The app never
processes, verifies, records, or depends on money. The game stays free; nothing is gated.

B. Record — but do not implement — the paid-results program, because the requested
mechanism (a paypal.me link) **cannot verify that a payment happened** and therefore cannot
gate results without being security theater around real money. The honest architecture and
the exact owner-provided inputs it requires are specified in `06-technical-refinement.md`.

## Policy authority

`CLAUDE.md` constraint #1 ("The game is free. Never add payment… logic") previously barred
all of this. Per the Authority-and-Precedence rule, the owner's written directive is the
recorded exception; the constraint text has been revised (2026-07-10) to permit exactly the
voluntary donate link and to keep paid gating forbidden until Workstream B's own gates pass.
All 12 agent-mirror files were updated in the same stream (KIMI/GEMINI/GLM/QWEN/DEEPSEEK/
OPENAI/ANTHROPIC/MISTRAL.md, AGENTS.md, codex.md, cursor.md, .cursorrules,
.cursor/rules/non-negotiables.mdc).

## Assumptions (labeled)

- The owner controls the `ihabkhaled94` PayPal.me handle (stated in the directive).
- Donations require no PayPal API, account linkage, or webhooks — paypal.me is a plain link.
- The real handle lives only in `.env` (gitignored); `.env.example` ships an empty value.
- The share URL connection requested for payments is deferred to Workstream B (order ↔
  requestId ↔ shareId binding is specified there).
