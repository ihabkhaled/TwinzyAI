---
id: quality-documentation-review-standard
title: Documentation Review Standard
type: quality
authority: canonical
status: current
owner: repository owner
summary: How canonical docs are reviewed — frontmatter template compliance, resolvable links, one-fact-one-owner, evidence-grounded claims, and a passing knowledge:validate.
keywords: [documentation, review, frontmatter, links, one-fact-one-owner, knowledge, validate, staleness]
contextTier: 2
relatedCode: [scripts/knowledge/build.mjs]
relatedTests: []
relatedDocs: [knowledge/templates/canonical-doc.md, knowledge/README.md, docs/sdlc/documentation-baseline.md, knowledge/freshness-policy.yaml]
readWhen: You are reviewing a documentation change or authoring a new canonical doc.
---

# Documentation Review Standard

Applies to every canonical doc (the plane roots listed in
[knowledge/manifest.yaml](../knowledge/manifest.yaml)). The when-docs-must-change policy is
owned by [docs/sdlc/documentation-baseline.md](../docs/sdlc/documentation-baseline.md); this
standard is the per-document review bar.

## Review checklist

1. **Frontmatter** — starts with the template at
   [knowledge/templates/canonical-doc.md](../knowledge/templates/canonical-doc.md): unique
   kebab-case `id`, correct `type`, `authority: canonical`, `status: current`, one-sentence
   `summary`, 5–12 lowercase `keywords`, a justified `contextTier`, and
   `relatedCode`/`relatedTests`/`relatedDocs` that are **real repo-relative paths**.
2. **Evidence** — every factual claim is grounded in code or a recorded decision, cited by
   repo-relative path. Speculation is written as `Not applicable — <why>` or
   `Deferred — needs <evidence>`, never invented.
3. **One fact, one owner** — the doc links to the owning doc instead of restating its detail;
   restated facts are review blockers because they rot independently
   ([knowledge/README.md](../knowledge/README.md) editing rules).
4. **Links resolve** — every markdown link resolves from the file's location; broken links fail
   validation.
5. **Size and focus** — one concern per file, under ~250 lines; split rather than sprawl.
6. **Public-repo safe** — no secrets, tokens, personal data, or internal URLs.
7. **Currency** — the doc reflects the current product truth (e.g. free-by-default with the
   env-gated paywall recorded in
   [docs/features/paypal-donations-and-paid-results/22-go-no-go.md](../docs/features/paypal-donations-and-paid-results/22-go-no-go.md)),
   not superseded absolutes; known-stale docs are tracked in
   [technical-debt-register.md](technical-debt-register.md).

## Mechanical validation

- `npm run knowledge:validate` — frontmatter, links, source refs, packs, and generated-file
  drift ([knowledge/README.md](../knowledge/README.md)).
- Editing anything under `knowledge/` requires rebuilding `.ai/` in the same commit
  (`npm run knowledge:build`); pre-push and CI verify drift (same source).
- Staleness triggers are declared in
  [knowledge/freshness-policy.yaml](../knowledge/freshness-policy.yaml); `npm run
  knowledge:report` surfaces stale items, contradictions, orphans, and dupes.

## YAML documents

2-space indentation, no tabs, prettier-clean (`npm run format:check` covers them —
[package.json](../package.json)).
