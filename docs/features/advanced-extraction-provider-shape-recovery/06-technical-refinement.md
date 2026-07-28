# Technical Refinement

## Root cause

Prompt 1 showed one structured example only for `stableVisibleStructure`, left the remaining
matching arrays and every counterfactual array empty, and described counterfactuals as "text-only
evidence views." Gemini consistently returned strings in those arrays. The strict
`MatchingSignalSchema` correctly requires objects, so adapter pre-validation exhausted the chain.
The deterministic fake extraction fixture omitted both enhanced sections, hiding the defect.

## Chosen approach

Keep the shared output contract strict. At the provider boundary only, map each non-empty string
entry in known enhanced signal arrays to a low-confidence, weight-1, uncertain signal with a
deterministic path/index ID and no modifiers. Feed that normalized value through the unchanged Zod
schema. Use the same normalizer in model-chain acceptance and final parsing. Apply the existing
matching-profile normalization and scan every new text leaf for forbidden wording.

Prompt 1 will show the full object form for every array and use one enum token per `affectedBy`
entry.

## Rejected

- Removing enhanced profiles: violates product intent.
- Making the shared schema a loose union: leaks provider quirks into the public contract.
- Dropping malformed enhanced fields: silently disables the enhancement.
- Accepting arbitrary objects or values: weakens validation and safety.

