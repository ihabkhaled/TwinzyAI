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
