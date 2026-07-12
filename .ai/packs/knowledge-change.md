<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: Knowledge OS — docs, routing, packs, compiler

Task type: `knowledge-change` · Lane: **standard** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- .ai/ is generated only; authored truth lives in knowledge/ and the canonical dirs.
- Every knowledge edit rebuilds .ai/ in the same commit (knowledge:build) and passes knowledge:validate.
- Budgets are hard — bootstrap/hot-memory ≤1,500 tokens, summaries ≤2,500, packs ≤6,000.
- One fact, one owner; contradictions get registry entries, never silent merges.

## Must-read docs

- knowledge/README.md — Owner's manual for the knowledge plane — what is authored here, what is compiled into .ai/, and the commands that connect them. (~1091 tokens)
- rules/31-knowledge-management.md — The three knowledge planes, one-fact-one-owner, authority precedence, and the obligation to keep the compiled plane in sync with every knowledge change. (~778 tokens)

## Rules

- rules/31-knowledge-management.md — The three knowledge planes, one-fact-one-owner, authority precedence, and the obligation to keep the compiled plane in sync with every knowledge change. (~778 tokens)

## Skills

- skills/resolve-task-context.md
- skills/prepare-agent-mirrors.md

## Code entrypoints

- `knowledge/`
- `scripts/knowledge/`
- `.ai/`
- `context/`
- `memory/`

## Validation before done

- `npm run knowledge:build`
- `npm run knowledge:validate`
- `npm run knowledge:benchmark`

## Notes

The compiler lives in scripts/knowledge/ (plain ESM, repo lint rules apply). New task types need routing-map + pack + vocabulary + golden task entries together.
