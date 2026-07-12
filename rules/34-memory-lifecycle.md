---
id: rule-34-memory-lifecycle
title: 34 — Memory Lifecycle (hot memory, standing decisions, retirement)
type: rule
authority: canonical
status: current
owner: repository owner
summary: Memory entries are dated, evidenced, scoped, and lifecycle-managed; hot memory holds only active facts and is pruned aggressively.
keywords: [memory, hot memory, decisions, pitfalls, lifecycle, superseded]
contextTier: 2
relatedDocs: [memory/README.md, knowledge/hot-memory.md]
readWhen: recording a decision, pitfall, or learning, or pruning hot memory
---

# 34 — Memory Lifecycle

1. **Every memory entry is dated, evidenced, and scoped.** A decision or pitfall records when
   it was made, what evidence supports it (paths, commits, incidents), and what it applies to.
   Undated, unevidenced memory is folklore and gets retired.
2. **Hot memory is a working set, not an archive.**
   [knowledge/hot-memory.md](../knowledge/hot-memory.md) (compiled to `.ai/HOT_MEMORY.md`)
   holds only currently active, high-impact facts: in-flight programs, recent landings agents
   commonly misjudge, live traps, open process debt. Budget ≤ ~1,500 tokens.
3. **Prune on resolution.** When a hot fact is resolved, superseded, or promoted into a
   permanent rule/ADR, remove it from hot memory in the same delivery stream. History belongs
   in `memory/`, ADRs, or the feature folder — never in the hot set.
4. **Promotion path.** Repeated pitfalls become permanent rules; repeated decisions become
   ADRs; per-request learnings stay in the retrospective. When promoting, update the canonical
   owner first, then delete the memory duplicate (one fact, one owner).
5. **Supersession is explicit.** A superseded decision gets `supersededBy` (or an explicit
   note naming the replacement); the replacement cites what it replaced. Agents must be able
   to trust that an un-superseded memory is still current.
6. **Memories are recall hints, not authority.** When a memory conflicts with code, tests, or
   a recorded owner decision, the conflict is a contradiction to record and resolve — the
   memory alone never wins ([knowledge/authority-map.yaml](../knowledge/authority-map.yaml)).
