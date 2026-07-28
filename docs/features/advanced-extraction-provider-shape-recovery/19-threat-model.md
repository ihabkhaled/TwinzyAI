# 19 - Threat Model

## Scope And Assets

The changed boundary is untrusted Gemini JSON entering the extraction pipeline. Protected assets
are image privacy, written-trait integrity, prompt isolation, AI-safety enforcement, service
availability, payment delivery guarantees, and provider credentials.

| Threat | Impact | Mitigation | Residual risk |
| --- | --- | --- | --- |
| Broad coercion hides malformed provider output | Invalid data enters the game | Normalize only known arrays and bounded non-empty strings; strict Zod parses afterward | Provider may still exhaust all three entries and return a typed failure |
| Shorthand bypasses safety filtering | Forbidden text reaches later prompts | Collect normalized enhanced `id`, `value`, and quality-cap text before safety validation; treat unsafe extraction content as a failed route entry | Existing classifier limitations remain |
| Provider payload leaks through logs | Privacy or provider-data exposure | Log normalized count only; existing redaction remains | Operational metadata remains visible by design |
| Recovery retries grow latency/cost | Slow or expensive requests | Existing router cap remains three entries; no new retry loop | Three sequential provider calls can still reach configured timeout |
| Payment captured without a deliverable result | Financial harm | PayPal capture remains after complete result; Paymob compensation remains active | External provider settlement timing may present temporary authorization holds |

No image path, persistence, biometric processing, identity claim, new secret, endpoint, or
production payment bypass is introduced.
