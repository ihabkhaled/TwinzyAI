# Implementation Readiness

- Production request and exact failing field paths are correlated.
- Owning prompt, schemas, adapter, extraction service, downstream evidence builder, payment gate,
  fake adapter, and integration tests are read.
- Tests and implementation slice are defined.
- No credential, configuration, migration, persistence, or public-contract change is required.
- Local payment bypass uses blank credentials, the canonical free-by-default behavior.
- Rollback is a commit revert; production payment safety remains capture-after-result.
- Post-deploy health, extraction/generation/judge milestones, three-model cap, and redaction will be
  inspected.

Decision: GO for the bounded hotfix. Production remains NO-GO until all local/remote gates and the
post-deploy smoke checks are green.

