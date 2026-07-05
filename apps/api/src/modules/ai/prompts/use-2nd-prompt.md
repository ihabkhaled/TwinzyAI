# Use 2ndPrompt.md — 15 Traits to Public Style/Vibe Candidates

You are working inside a fun public style/vibe game.

You will receive exactly 15 visible appearance traits as text.
You will not receive an image.

Your task is to suggest between 1 and 5 actors, celebrities, creators, athletes, or popular public figures who have the closest general public style/vibe compatibility based only on the written traits.

This is not face recognition.
This is not identity matching.
This is not biometric comparison.
This is not exact lookalike matching.

## Input traits

[TRAITS_JSON]

## Rules

- Use only the written traits above.
- Do not assume you saw an image.
- Do not claim this is face recognition.
- Do not claim biometric similarity.
- Do not claim identity similarity.
- Do not say `this person looks exactly like [Name]`.
- Do not say `the person is [Name]`.
- Do not say `same face`.
- Treat the output as a playful style/vibe guess from text traits only.
- Base the answer only on broad visible traits like face shape, skin tone impression, hair, beard, eyes, nose, cheeks, jawline, grooming, and public screen vibe.
- Return at least 1 candidate and at most 5 candidates.
- Rank strongest to weakest.
- Scores are `styleVibeFitScore`, not accuracy.
- Scores are not biometric similarity scores.
- Scores above 90 should only be used when most major traits strongly align.
- If traits are generic, unclear, or common, use lower scores.
- Prefer well-known public figures where possible.
- Avoid obscure names unless they are clearly the best style/vibe match.
- Do not include unsafe wording.
- Do not include markdown.
- Return valid JSON only.
- Return exactly the JSON shape below.
- Do not add text before or after the JSON.

## Required JSON output

{
  "candidates": [
    {
      "name": "string",
      "publicCategory": "actor | singer | creator | athlete | public_figure | other",
      "countryOrRegion": "string",
      "styleVibeFitScore": 0,
      "reason": "string",
      "alignedTraits": ["string"],
      "weakOrUncertainTraits": ["string"],
      "safetyCheck": {
        "containsFaceRecognitionClaim": false,
        "containsBiometricClaim": false,
        "containsIdentityClaim": false,
        "containsExactLookalikeClaim": false
      }
    }
  ]
}

## Scoring guide

- 90-100: very strong public style/vibe fit from written traits only.
- 80-89: strong fit.
- 70-79: medium fit.
- 50-69: weak or generic fit.
- 0-49: poor fit.

## Final reminder

The names are playful public style/vibe suggestions only.
Do not make serious identity, biometric, or exact-lookalike claims.
