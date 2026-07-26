# 15 — Code review

- Boundaries: XML rendering is owned by shared helpers; Route Handlers only validate parameters and
  return responses; proxy logic remains routing/CSP only.
- Privacy: feeds are static editorial data; contact messages transit the API and configured SMTP
  provider without Twinzy persistence, analytics payload, or account requirement.
- Security: locale values are allowlisted, XML is escaped, responses use `nosn`, contact input is
  length-bounded and Zod-validated, the recipient is configuration-owned, and SMTP file/URL access
  is disabled.
- Compatibility: `app/sitemap.ts` was retained explicitly; share and payment surfaces remain
  excluded from crawl artifacts.
- Completeness: root sitemap coverage is derived from the canonical route and language owners, and
  tests assert the full 120-URL cross-product plus all hreflang alternatives.
- Startup hygiene: cache cleanup targets only generated Twinzy frontend directories and is wired
  through npm lifecycle hooks for development, E2E development, and production start commands.
- Header scope: the proxy applies the nonce CSP only to HTML surfaces; machine XML keeps its XML
  content type and security headers without an irrelevant policy that breaks Chrome's XML viewer.
