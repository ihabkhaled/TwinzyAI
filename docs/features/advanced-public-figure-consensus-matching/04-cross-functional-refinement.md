# Cross-Functional Refinement

## Findings

- Product: regional locale is a recall hint, never a photo-derived demographic assertion.
- Architecture: extend existing AI routing/concurrency owners; add a bounded public-figures module.
- Privacy: external enrichment receives final entity ID and language only.
- Security: HTTPS, hostname allowlist, timeout, bytes, redirects, content type, Zod, rate limit, circuit break, and safe logs are mandatory.
- Accessibility/i18n: semantic BiDi isolation, focus trap, Escape close, focus restoration, safe links, and localized states.
- Legal/content: Commons image source/license handling is displayed; absence yields a neutral placeholder.
- Operations: flags off by default; enrichment and ensemble fail soft without leaking provider internals.

## Decisions

The supplied specification is the owner-approved target design. No database is introduced. An in-memory bounded TTL cache contains public metadata only. Public contracts are additive where practical. Release requires owner UAT and GO; implementation completion does not imply production enablement.

