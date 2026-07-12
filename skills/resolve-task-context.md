---
id: skill-resolve-task-context
title: Resolve task context (the fast-task protocol)
type: skill
authority: canonical
status: current
owner: repository owner
summary: The mandatory first step of any task — classify, resolve the minimal context pack, read the exact owner code and tests, then plan.
keywords: [context, resolver, fast task, routing, pack, classify, bootstrap]
contextTier: 2
relatedCode: [scripts/knowledge/resolve-context.mjs, scripts/knowledge/classify-task.mjs]
relatedDocs: [knowledge/README.md, rules/31-knowledge-management.md]
readWhen: starting any task, before reading repository files broadly
---

# Skill: Resolve task context (the fast-task protocol)

Goal: go from "task received" to "grounded plan on the exact owner files" in seconds, loading
the minimum context that is still safe. Never wander the repository.

## Steps

1. **Load the bootstrap** (once per session): [.ai/BOOTSTRAP.md](../.ai/BOOTSTRAP.md).
   It carries the universal invariants, the authority order, and the open critical items.
2. **Resolve the task**:

   ```bash
   npm run knowledge:context -- --task="<exact user request>"
   # with known files:
   npm run knowledge:context -- --task="..." --files=apps/api/src/a.ts,apps/web/src/b.tsx
   # with a branch diff:
   npm run knowledge:context -- --task="..." --diff=origin/main...HEAD
   ```

   Read `.ai/local/current-context.md`. It names the task type, delivery lane, context pack,
   exact docs/rules/skills, likely source and tests, reviewers, and validation commands.
3. **Resolve ambiguities first.** The brief lists them explicitly (no module matched, low
   confidence, missing files). Confirm ownership before editing — never guess when the
   resolver's confidence is low; check the runners-up or search for the symbol.
4. **Read the pack, the owner source, and its tests in parallel.** The pack
   (`.ai/packs/<type>.md`) carries the area invariants; the source and tests carry the truth.
5. **Escalate the lane, never de-escalate.** If the resolved lane is `critical` (payments,
   privacy, uploads, prompts, contracts, releases…), follow
   [knowledge/delivery-lanes.yaml](../knowledge/delivery-lanes.yaml): full artifacts,
   specialist reviewers, threat-model thinking.
6. **Plan immediately** (objective → owner → files → contracts → steps → tests → risks →
   docs delta → rollback), then implement. Expand context only when evidence demands it —
   a failing import, a contradiction, a boundary crossing.
7. **Close the loop.** Run the pack's validation commands; update the canonical docs the
   impact requires; if any knowledge input changed, run `npm run knowledge:build` and commit
   the regenerated `.ai/` with the change.

## When the resolver is unavailable

If `.ai/` indexes are missing (fresh clone before first build), run
`npm run knowledge:build` once, or fall back to [.ai/QUICK_ROUTER.md](../.ai/QUICK_ROUTER.md)
and [context/codebase-navigation.md](../context/codebase-navigation.md).

## What this skill forbids

- Reading every documentation folder "to be safe" — route, then read.
- Starting implementation before the ambiguity list is empty or consciously accepted.
- Loading tier-3/4 documents (deep dives, history) for a routine change.
- Editing anything under `.ai/` by hand.
