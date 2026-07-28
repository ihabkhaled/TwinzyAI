# Technical Roadmap

This hotfix is one reviewable slice on `main`: tests and incident artifacts, provider-boundary
normalization plus prompt correction, then validation/release evidence. There is no schema
migration. Rollout follows the normal GitHub-to-Vercel production deployment. Rollback is commit
revert; the three-model cap and payment transaction ordering remain active throughout.

