# Database Decisions

> **Standing decision: this project has no database and no persistence layer — by design, for
> privacy.** This is not a gap awaiting a schema; it is the product's core privacy guarantee
> made structural. See [privacy-decisions.md](./privacy-decisions.md) and
> [/docs/privacy-and-data-retention.md](../docs/privacy-and-data-retention.md).

## Decision 1 — Nothing is persisted

**What:** no ORM, no database, no cache store, no queue, no file storage. The uploaded image is
processed in memory only and zero-filled in a `finally`; trait text and results are transient
per-request state that dies with the response.

**Why:** Twinzy's promise is a privacy-safe game — one photo in, playful text out, nothing
retained. The cheapest way to never leak stored data is to never store data. It also removes an
entire class of work (migrations, backups, retention policies, breach surface).

**Consequences (accepted):**

- No accounts, no history, no server-side result sharing state.
- Results the user wants to keep are shared client-side (web workstream concern).
- Horizontal scaling is trivial: instances are stateless.
- No repository layer exists in any module; `infrastructure/` folders stay empty until a real
  infrastructure concern (not persistence) needs a home.

## Decision 2 — Any storage proposal requires an ADR + privacy review

If a future feature appears to need persistence (e.g. abuse-rate tracking, aggregate metrics):

1. Write an ADR under [/architecture/adrs/](../architecture/adrs/README.md) — template at
   [adr-template.md](../architecture/adrs/adr-template.md).
2. Pass an explicit privacy review against [privacy-decisions.md](./privacy-decisions.md) and
   [/docs/security-threat-model.md](../docs/security-threat-model.md).
3. If adopted, the repository rules bind in full:
   [/rules/20-repositories-database.md](../rules/20-repositories-database.md) — all data access
   behind a repository, parameterized queries, bounded lists, ORM hidden as an implementation
   detail — plus a row in [library-boundaries.md](./library-boundaries.md) and the ESLint
   package-boundaries config.

## Decision 3 — Images may NEVER be persisted, regardless

Even if Decision 2 is ever exercised for some other data class, **the uploaded image (and any
derivative that could identify a person: embeddings, biometric templates, face crops, image
URLs) is permanently out of scope for storage.** This is absolute and not revisitable by ADR —
it is a product-defining invariant alongside "no face recognition, no identity matching, no
payments" ([/rules/14-ai-safety.md](../rules/14-ai-safety.md)).

## Anti-patterns (reject in review)

- "Temporary" disk writes of upload buffers (multipart must stay in memory).
- Caching AI responses keyed by anything derived from the image.
- Adding a DB/ORM/cache/queue dependency to `package.json` without the ADR above — the
  dependency review and Trivy/lint gates treat it as a boundary violation.
- Logging payloads as a de-facto datastore ([observability-decisions.md](./observability-decisions.md)).

**Related:** [privacy-decisions.md](./privacy-decisions.md) ·
[event-notification-decisions.md](./event-notification-decisions.md) ·
[project-architecture.md](./project-architecture.md) ·
[/rules/20-repositories-database.md](../rules/20-repositories-database.md)
