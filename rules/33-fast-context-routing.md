---
id: rule-33-fast-context-routing
title: 33 — Fast Context Routing (resolver-first, budgets, no wandering)
type: rule
authority: canonical
status: current
owner: repository owner
summary: Agents route through the compiled plane instead of reading the repository wholesale; context budgets are hard and expansion needs evidence.
keywords: [routing, resolver, context budget, fast task, packs, tiers]
contextTier: 2
relatedCode: [scripts/knowledge/resolve-context.mjs]
relatedDocs: [skills/resolve-task-context.md, knowledge/context-budget-policy.yaml]
readWhen: starting any task, or designing agent behavior for this repository
---

# 33 — Fast Context Routing

1. **Resolver first.** Every task starts with `.ai/BOOTSTRAP.md` plus
   `npm run knowledge:context -- --task="..."`. Reading documentation folders wholesale,
   loading every rule, or "orienting" by directory browsing is forbidden when the resolver is
   available — route, then read.
2. **Budgets are hard.** Bootstrap ≤ ~1,500 tokens; hot memory ≤ ~1,500; summaries ≤ ~2,500;
   packs ≤ ~6,000 (critical lane ≤ ~15,000); a routine task's initial context ≤ ~8,000 tokens
   and < 15 documents ([knowledge/context-budget-policy.yaml](../knowledge/context-budget-policy.yaml)).
   The build fails on budget overruns — trim the source, never raise the budget casually.
3. **Speed comes from precomputation, never from skipping.** Manifests, indexes, packs, and
   graphs are compiled offline so planning starts in seconds. Correctness work — reading the
   owner code and tests, validation, security/privacy review — is never traded for latency.
4. **Expand on evidence only.** Load more context when a dependency is unclear, a
   contradiction appears, the task crosses a module boundary, or the lane escalates — and note
   why. Low resolver confidence means confirm ownership, not guess.
5. **Parallel retrieval.** Independent reads (pack, owner source, tests, contract, pitfalls)
   happen concurrently when tooling allows; serial context crawling wastes the latency the
   compiler bought.
6. **Golden performance is a gate.** `npm run knowledge:benchmark` must stay green: correct
   task type/lane per golden task, every mustInclude present, resolver p95 under the policy
   target. A failing benchmark blocks knowledge changes like a failing test blocks code.
