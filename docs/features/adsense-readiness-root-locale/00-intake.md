# 00 — Intake

- **Request:** Fix Google AdSense readiness, crawlability, low-value-content signals, root English routing, and locale-switch loading feedback.
- **Date:** 2026-08-08
- **Lane:** Standard production bug/content-readiness change.
- **User-visible acceptance:** `/` is English HTTP 200 without redirect; `/en` and `/ar` work; crawler endpoints bypass middleware; AdSense loader appears once; public informational pages remain crawlable; locale changes show an accessible loader.
- **Explicit authorization:** Implement, commit, and push.
