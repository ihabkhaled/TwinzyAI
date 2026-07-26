# 22 — Go / no-go

Status: **GO after automated gates pass**.

Required evidence: lint 0/0, strict typecheck, unit and touched-module coverage, production builds,
knowledge validation, security scan, GitHub push gates, and both Vercel projects ready. Rollback is
the feature commit; no migration or persisted data exists.

Contact release additionally requires server-only SMTP configuration, disabled-by-default
behavior, rate-limit verification, and a credential rotation whenever a secret is exposed.

The generated knowledge snapshot must be rebuilt until its stale-item analysis is stable before
the release commit is pushed.

The sitemap release gate additionally requires 120 canonical localized URLs (10 public routes ×
12 languages), complete hreflang clusters, and continued exclusion of noindex share/payment
surfaces.
