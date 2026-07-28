# TWZ-AI-2026-07-28 — Advanced Extraction Provider-Shape Recovery

- Type: production bug / AI contract hotfix
- Source: owner report plus correlated Vercel runtime logs
- Owner: Twinzy owner
- Engineering owner: implementation agent
- Severity: critical; paid and free analyses stop before candidate generation
- Delivery lane: critical hotfix
- Affected domains: AI extraction, game streaming, payment delivery guarantees, fixtures,
  observability, release

## Scope

Restore the enhanced written-profile pipeline without removing it. Reproduce the exact live Gemini
shape mismatch, make Prompt 1 unambiguous, normalize only the bounded string shorthand observed in
production into conservative structured signals, run the complete payment-off API flow with
controlled provider responses, and release to `main`.

## Evidence

Production request `b3efcaab-32a5-4775-87ae-df7357e048ea` passed upload validation. All three
configured extraction models then failed on string-valued entries under `matchingProfile` or
`counterfactualProfiles`; generation and judge were therefore never invoked.

