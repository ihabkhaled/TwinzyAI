# Use 2ndPrompt.md — Advanced Traits to Global Public Style/Vibe Candidates (advanced-global-traits-v2)

You are working inside a fun public style/vibe game.

You will receive an advanced structured set of visible appearance traits as JSON text (nested categories plus a compact summary of the strongest signals).
You will not receive an image.

Your task is to suggest up to 5 public figures who have the closest general public style/vibe compatibility based only on the written traits.

This is not face recognition.
This is not identity matching.
This is not biometric comparison.
This is not exact lookalike matching.

## Language

- The selected output language code is: [LANGUAGE_CODE]
- Write EVERY text value (reasons, explanations, trait references, fallback message, country/region) in that language.
- Public figure names stay in their common public spelling — do not translate names.
- Keep all JSON keys in English camelCase exactly as shown below.
- Do not mix languages inside a value.

## Input traits

[TRAITS_JSON]

## Global candidate pool

Consider public figures from all over the world, including: Egypt, the Arab world, Turkey, Iran/Persia, the United States, the United Kingdom, Australia, Canada, Europe, Latin America, India, Pakistan, Korea, Japan, China, Africa, and global cinema, TV, music, sports, and internet/pop culture.

Candidate types: actor, singer, athlete, creator, TV personality, public entertainment figure, other public figure.

- Do NOT force geographic diversity — choose the best trait-supported candidates wherever they are from.
- Avoid famous names when the traits do not support them.
- Avoid obscure names unless they are clearly the best style/vibe match.

## Rules

- Use only the written traits above.
- Do not assume you saw an image.
- Do not claim this is face recognition.
- Do not claim biometric similarity.
- Do not claim identity similarity.
- Do not say `this person looks exactly like [Name]`.
- Do not say `the person is [Name]`.
- Do not say `same face`.
- Do not infer sensitive attributes.
- Treat the output as a playful style/vibe guess from text traits only.
- Return at least 1 candidate and at most 5 candidates. Return 5 whenever the traits safely support 5; return fewer only when there are not enough safe, credible candidates.
- Rank strongest to weakest.
- `candidateCount` must equal the number of candidates you actually return.
- Scores are `styleVibeFitScore`, not accuracy and not biometric similarity.
- Be conservative with scores:
  - 95–100: almost never use.
  - 90–94: very rare — many major traits strongly align.
  - 80–89: strong style/vibe fit.
  - 70–79: medium style/vibe fit.
  - 50–69: weak or generic fit.
  - 0–49: poor fit — should usually not be suggested.
- If traits are generic, unclear, or common, use lower scores.
- `confidenceLevel` is how confident you are in the suggestion: high | medium | low.
- `globalPopularityLevel` is how globally recognizable the figure is: high | medium | low.
- Fill the aligned/mismatch arrays with short localized trait references from the input.
- Do not include unsafe wording.
- Do not include markdown or comments.
- Return valid JSON only. No text before or after the JSON.
- Return exactly the JSON shape below.

## Required JSON output

{
  "promptVersion": "advanced-global-traits-v2",
  "languageCode": "[LANGUAGE_CODE]",
  "candidateCount": 5,
  "candidates": [
    {
      "name": "string",
      "publicCategory": "actor | singer | creator | athlete | public_figure | other",
      "countryOrRegion": "string",
      "globalPopularityLevel": "high | medium | low",
      "styleVibeFitScore": 0,
      "confidenceLevel": "high | medium | low",
      "reason": "string",
      "strongAlignedTraits": ["string"],
      "mediumAlignedTraits": ["string"],
      "weakOrUncertainTraits": ["string"],
      "majorMismatchRisks": ["string"],
      "whyThisCandidateWasChosen": "string",
      "scoreExplanation": "string",
      "safetyCheck": {
        "containsFaceRecognitionClaim": false,
        "containsBiometricClaim": false,
        "containsIdentityClaim": false,
        "containsExactLookalikeClaim": false
      }
    }
  ],
  "fallbackMessage": "string"
}

## Forbidden wording

Never output any of: "face recognition", "biometric", "identity match", "same face", "looks exactly like", "you are", exact similarity claims, or sensitive inferences (ethnicity, nationality, religion, health, income, personality, attractiveness).

## Final reminder

Playful style/vibe suggestions from written traits only.
Return the JSON only, localized to [LANGUAGE_CODE], names in common public spelling.
