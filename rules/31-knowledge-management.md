---
id: rule-31-knowledge-management
title: 31 — Knowledge Management (planes, ownership, authority)
type: rule
authority: canonical
status: current
owner: repository owner
summary: The three knowledge planes, one-fact-one-owner, authority precedence, and the obligation to keep the compiled plane in sync with every knowledge change.
keywords: [knowledge, planes, ownership, authority, compiled, canonical, bootstrap]
contextTier: 2
relatedCode: [scripts/knowledge/build.mjs]
relatedDocs: [knowledge/README.md, knowledge/authority-map.yaml]
readWhen: creating, moving, or retiring any documentation or knowledge definition
---

# 31 — Knowledge Management

> The repository runs a three-plane knowledge operating system. These rules are permanent and
> apply to every documentation, routing, or knowledge change.

1. **Three planes, one direction.** The **canonical plane** (CLAUDE.md, `rules/`, `skills/`,
   `context/`, `memory/`, `agents/`, `testing/`, `support/`, `runbooks/`, `structure/`,
   `product/`, `domain/`, `contracts/`, `operations/`, `incidents/`, `quality/`, `docs/`,
   `knowledge/`) is authored. The **compiled plane** (`.ai/`) is generated from it by
   `npm run knowledge:build`. The **execution plane** is the fast-task protocol
   ([skills/resolve-task-context.md](../skills/resolve-task-context.md)). Facts flow canonical →
   compiled, never backwards.
2. **One fact, one owner.** Every important fact has exactly one canonical home
   (policy → rules; decisions → ADRs/`memory/`; module structure → `structure/`; product
   promises → `product/`; domain invariants → `domain/`; external contracts → `contracts/`;
   procedures → `skills/`/`runbooks/`; support answers → `support/`; generated inventory →
   `.ai/manifests`). Summaries and bootstraps cite the owner; they never redefine the fact.
3. **Authority precedence** is recorded in
   [knowledge/authority-map.yaml](../knowledge/authority-map.yaml) and never improvised.
   When two rules overlap, the stricter wins. Code and tests are evidence of behavior, not of
   approved policy — a behavior/policy gap is a contradiction to record
   ([knowledge/contradiction-checks.yaml](../knowledge/contradiction-checks.yaml)), never a
   silent merge.
4. **Knowledge changes rebuild in the same commit.** Any change to `knowledge/` or to a
   canonical doc that feeds a compiled artifact ships with a fresh `npm run knowledge:build`
   and green `npm run knowledge:validate`. CI and pre-push verify drift; a stale `.ai/` is a
   broken build.
5. **New task categories are complete or absent.** Adding a task type means the routing-map
   entry, a pack in `knowledge/packs.yaml`, vocabulary terms, and a golden task in
   `knowledge/golden/tasks.yaml`, together.
6. **Contradiction discipline.** Discovered contradictions get a registry entry with sources,
   severity, owner, and resolution path. Critical open entries are compiled into
   `.ai/BOOTSTRAP.md` automatically and stay there until resolved.
7. **Public-repo safety.** No secrets, tokens, personal data, or user content anywhere in the
   knowledge system — either plane.
