# Public Reference Points

## Purpose

The Twinzy SDLC does not claim to reproduce any private internal workflow from any company. It is informed by publicly available engineering and security guidance that reflects the kind of rigor expected in high-performing software organizations, scaled to a small, privacy-sensitive product.

## Reference Themes

### Small, Reviewable Changes

- Google Engineering Practices emphasizes small changelists, tests with the change, and easier rollback — mirrored here by the sliced technical roadmap (`07-technical-roadmap.md`) and the review checklist.

### Fast, Serious Code Review

- Google Engineering Practices emphasizes timely review, preserving code health, and reviewer clarity — mirrored by [`code-review-checklist.md`](./code-review-checklist.md) and [`rules/23-review-checklist.md`](../../rules/23-review-checklist.md).

### Release Governance and Rollback Discipline

- Google SRE release engineering guidance emphasizes controlled release processes, gated operations, archived release artifacts, and test-bearing releases — mirrored by [`release-checklist.md`](./release-checklist.md) and the runbooks in [`runbooks/`](../../runbooks/README.md).

### Blameless Postmortems and Organizational Learning

- Google SRE postmortem guidance emphasizes written postmortems, action tracking, and blameless learning after incidents — mirrored by the `27-postmortem.md` / `27-retrospective.md` phase artifacts.

### Secure Software Supply Chain

- Google Cloud guidance emphasizes build provenance, delivery integrity, and stronger CI/CD controls — mirrored by the trivy `security:scan` gate and Husky-enforced hooks.

### Security, Privacy, Auditability, and Administrative Controls

- OpenAI public security materials emphasize encryption, testing, monitoring, compliance support, and audit-oriented controls — relevant here because Twinzy's core promise is privacy: no image persistence, no biometrics, text-only downstream AI prompts.

## How To Use These References

- use them as public justification for rigor, not as a claim that this repository reproduces any private internal process
- prefer the principles over stack-specific implementation detail
- translate the ideas into this repository's language, tooling, and architecture rather than copying terminology blindly

## Recommended Links

- Google Engineering Practices: https://google.github.io/eng-practices/
- Small CLs: https://google.github.io/eng-practices/review/developer/small-cls.html
- Emergencies: https://google.github.io/eng-practices/review/emergencies.html
- Code review standard: https://google.github.io/eng-practices/review/reviewer/standard.html
- Google SRE release engineering: https://sre.google/sre-book/release-engineering/
- Google SRE postmortem culture: https://sre.google/sre-book/postmortem-culture/
- Google Cloud software supply chain security: https://docs.cloud.google.com/software-supply-chain-security/docs/overview
- OpenAI security: https://openai.com/security
- OpenAI compliance APIs for enterprise customers: https://help.openai.com/en/articles/9261474-compliance-apis-for-enterprise-customers
