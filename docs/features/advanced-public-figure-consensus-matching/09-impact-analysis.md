# Impact Analysis

Affected systems are API AI/game/result aggregation/config/benchmark, new public-figures module, shared contracts, web result/share presentation, i18n, docs, and CI evidence.

The public analysis endpoint remains stable; optional enrichment and entity IDs are additive where practical. Prompt/schema versions change together. No database, account, upload contract, payment flow, or image lifecycle changes.

Operational impact includes more configured model calls and external metadata traffic when flags enable. Metrics exclude photos, traits, raw prompts/responses, biographies, and identifiers. Support receives explicit fallback/licensing guidance.

Compliance impact is limited to public metadata/image licensing; source, author/credit, license, and source page are retained when an image exists.

