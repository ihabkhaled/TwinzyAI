# 09 — Impact Analysis

Affected: frontend routing, presentation, localization navigation, public configuration, crawler
indexing, tests, release notes, and production smoke checks. Unaffected: backend, APIs, AI pipeline,
uploads, auth, payments, storage, schemas, migrations, queues, analytics, and observability logging.
Caching impact is limited to normal Vercel static/route output; rollback remains a redeploy of the prior commit.
