# 14 — Implementation

Implemented on 2026-08-08:

- `/` now bypasses the locale redirect and receives an authoritative English request locale.
- `/en`, `/ar`, and all supported locale-prefixed editorial routes remain available.
- English homepage canonical/hreflang targets use `/`; other locales use their prefixes.
- Sitemap metadata and locale XML sitemaps share the same canonical rules.
- `/ads.txt`, `/robots.txt`, and `/sitemap.xml` bypass the proxy matcher; machine-path classification
  also includes all three defensively.
- Production web build configuration supplies the canonical web origin and public AdSense publisher ID.
- The existing root-layout AdSense component remains the single eligible-page script owner.
- Locale selection renders a disabled control plus accessible spinner during navigation/refresh.
- Game-route locale refresh preserves in-memory results; editorial locale changes use full navigation.
- Help and Terms now carry descriptions and internal links to the richer editorial pages.
- Security-gate transitive packages were patched to advisory-fixed versions through root overrides.
