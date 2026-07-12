---
id: rule-32-documentation-quality
title: 32 — Documentation Quality (frontmatter, evidence, structure)
type: rule
authority: canonical
status: current
owner: repository owner
summary: Every canonical document carries machine-readable frontmatter, cites evidence, stays focused, and is validated by knowledge:validate.
keywords: [documentation, frontmatter, evidence, links, quality, validation]
contextTier: 2
relatedCode: [scripts/knowledge/validate-frontmatter.mjs, scripts/knowledge/validate-links.mjs]
relatedDocs: [knowledge/templates/canonical-doc.md, rules/31-knowledge-management.md]
readWhen: writing or reviewing any canonical documentation
---

# 32 — Documentation Quality

1. **Frontmatter is mandatory in the knowledge-OS areas** (`structure/`, `product/`,
   `domain/`, `contracts/`, `operations/`, `incidents/`, `quality/`, `knowledge/`,
   `docs/ai/`): `id` (unique, kebab-case), `title`, `type`, `authority`, `summary` (one
   sentence the resolver can rank), `keywords` (5–12), `contextTier`, plus `relatedCode`/
   `relatedTests`/`relatedDocs` where they exist. Legacy areas adopt frontmatter whenever a
   document is meaningfully edited. `npm run knowledge:validate` enforces this progressively.
2. **Evidence over prose.** Factual claims cite repo-relative paths (clickable, resolvable).
   A section that would be speculation says `Not applicable — <why>` or
   `Deferred — needs <evidence>`. Placeholder stubs are forbidden.
3. **Context tiers are honest.** Tier 0–1 documents are dense digests; tier 2 is task detail;
   tier 3 deep investigation; tier 4 history. Never park routing-critical facts in tier 3–4.
4. **Links must resolve.** Broken relative links in frontmattered documents and `knowledge/`
   fail validation. Prefer linking the owning document over restating its content.
5. **Size discipline.** One document, one concern, roughly ≤250 lines; split before sprawl.
   Summaries obey the compiled token budgets
   ([knowledge/context-budget-policy.yaml](../knowledge/context-budget-policy.yaml)).
6. **Duplicate topics are defects.** Two documents owning the same fact must merge
   (`npm run knowledge:duplicates` reports candidates); the loser becomes a pointer or is
   retired with `supersededBy`.
7. **Docs ride the delivery stream.** Behavior changes update the owning documents in the same
   PR — the impact engine's documentation delta (`.ai/graphs/impact-graph.json`, freshness
   triggers) names them; "docs later" does not exist.
