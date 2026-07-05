# Security Threat Model

Assets: user photo (in transit/memory), Gemini API key, service availability.

Threats and mitigations:
- Malicious upload (polyglot, decompression bomb, malware): full validation chain + size cap +
  structural decode bounds + optional ClamAV (fail closed in prod).
- Data exfiltration via logs: LoggerService policy — no image bytes, no keys; redaction helpers.
- Provider error/response injection: Zod schema validation + forbidden-wording filter; raw
  provider errors never reach clients (DomainException envelope).
- Abuse/DoS: global throttling + stricter analyze route limit + upload size cap + timeouts.
- Secret leakage: keys only in backend env; images built without secrets; frontend bundle
  contains only NEXT_PUBLIC_* values.
- CORS/clickjacking/MIME sniffing: strict CORS allowlist, X-Frame-Options DENY, nosniff,
  referrer policy, helmet defaults.
