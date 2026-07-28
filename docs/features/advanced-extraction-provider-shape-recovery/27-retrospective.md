# 27 - Retrospective

## Learning

- Strict schemas correctly stopped malformed enhanced evidence, but prompt examples must specify
  every sibling array rather than relying on structural analogy.
- Canonical provider fixtures must exercise optional enhanced sections by default; otherwise
  validation drift can remain invisible through full green suites.
- Provider-boundary recovery may preserve availability only when it is narrow, bounded,
  observable without content, and followed by the unchanged strict schema and safety filter.
- Adapter prevalidation and final service parsing must share the same normalization path.

## Permanent Improvement

The prompt, fixtures, safety leaf collection, contracts, test catalog, and
`memory/known-pitfalls.md` now encode these lessons. No open action remains beyond final release
and hypercare evidence.
