---
id: support-release-support-checklist
title: Release Support Checklist — Before, During, and After a Release
type: support
authority: canonical
status: current
owner: repository owner
summary: The support-side checklist run for every release, tying the support-readiness template, smoke tests, known issues, and hypercare together.
keywords: [support, release, checklist, readiness, hypercare, smoke-test, known-issues, rollback]
contextTier: 2
relatedCode: []
relatedTests: []
relatedDocs:
  [
    support/support-readiness-template.md,
    runbooks/release-smoke-test.md,
    runbooks/hypercare.md,
    docs/sdlc/release-checklist.md,
  ]
readWhen: A release is being prepared, is going out, or just went out.
---

# Release Support Checklist

Release gating itself is owned by [`docs/sdlc/release-checklist.md`](../docs/sdlc/release-checklist.md) and the request's phase artifacts; this checklist is the support-side companion. Per-release support readiness is captured with [`support-readiness-template.md`](./support-readiness-template.md).

## Before the release

- [ ] Read the release notes for this release (`release-notes/` — one file per release, `release-notes/README.md`).
- [ ] Fill a support-readiness file from [`support-readiness-template.md`](./support-readiness-template.md): what changed for players, expected questions, new/changed copy.
- [ ] Check whether any env-gated feature flips with this release (paywall, donate link, ClamAV, AI routes) — verify against [feature-catalog.md](./feature-catalog.md).
- [ ] Review [known-issues.md](./known-issues.md); pre-open entries for anything the release ships as a known limitation.
- [ ] If player-facing copy changed: confirm both en and ar catalogs changed together (`apps/web/src/packages/i18n/messages/`), and that no copy contradicts the consent/privacy promises ([consent-troubleshooting.md](./consent-troubleshooting.md) escalation rule).
- [ ] Know the rollback story for this release ([`../runbooks/rollback.md`](../runbooks/rollback.md)) — support should never be surprised by a rollback.

## During the release window

- [ ] Engineering runs [`../runbooks/release-smoke-test.md`](../runbooks/release-smoke-test.md); support holds non-urgent replies until it passes.
- [ ] Watch for the "anything right after a release" pattern: new errors within the window are treated as release regressions first (`support/README.md` escalation table).

## After the release (hypercare)

- [ ] Hypercare window active per [`../runbooks/hypercare.md`](../runbooks/hypercare.md); know its duration and owner.
- [ ] Track player reports against the release's known-issues entries; convert repeated novel reports into new entries in [known-issues.md](./known-issues.md).
- [ ] Escalate anything matching a SEV-1/SEV-2 row in [escalation-matrix.md](./escalation-matrix.md) — release-window symptoms escalate faster, not slower.
- [ ] Share-link caveat: a redeploy cleared all active share links (KI-3) — expect a brief bump in "my link died" reports; use template T5 ([communication-templates.md](./communication-templates.md)).
- [ ] At window close: feed observations into the release's `26-hypercare-report.md` and retro (`27-retrospective.md`) via the repository owner.
