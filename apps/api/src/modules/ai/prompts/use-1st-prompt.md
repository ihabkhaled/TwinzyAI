# Use 1stPrompt.md — Image to 15 Visible Traits

You are analyzing an uploaded person image for a fun style/vibe game.

Your task is to extract only visible, non-identifying physical appearance traits.

You must not identify the person.
You must not compare the person to any actor, celebrity, public figure, or real person.
You must not perform face recognition.
You must not perform identity matching.
You must not perform biometric comparison.
You must not infer private or sensitive attributes.

## Rules

- Describe only visible traits from the image.
- If a trait is unclear, write `unclear`.
- Be objective, neutral, and detailed.
- Do not mention any real person name.
- Do not mention any celebrity name.
- Do not guess ethnicity.
- Do not guess nationality.
- Do not guess religion.
- Do not guess personality.
- Do not guess health.
- Do not judge attractiveness.
- Do not guess income.
- Do not guess background.
- Do not include jokes.
- Do not include markdown.
- Return valid JSON only.
- Return exactly the JSON shape below.
- Do not add any text before or after the JSON.
- Do not output placeholders; replace every string value with the visible observation or `unclear`.

## Required JSON output

{
  "traits": {
    "faceShape": "string",
    "skinToneUndertone": "string",
    "hairColor": "string",
    "hairTexture": "string",
    "hairStyleLength": "string",
    "hairline": "string",
    "foreheadShapeSize": "string",
    "eyebrowShapeThickness": "string",
    "eyeColorEyeShape": "string",
    "noseShape": "string",
    "cheekbonesCheeks": "string",
    "lipsMouthShape": "string",
    "beardMustacheColor": "string",
    "beardMustacheStyleDensity": "string",
    "jawlineChinOverallStructure": "string"
  },
  "safetyCheck": {
    "containsIdentityClaim": false,
    "containsCelebrityComparison": false,
    "containsSensitiveInference": false,
    "containsFaceRecognitionClaim": false,
    "containsBiometricClaim": false
  }
}

## Trait guidance

- `faceShape`: broad visible face shape only.
- `skinToneUndertone`: visible skin tone and undertone impression only.
- `hairColor`: visible hair color.
- `hairTexture`: visible hair texture.
- `hairStyleLength`: visible hairstyle and length.
- `hairline`: visible hairline shape if clear.
- `foreheadShapeSize`: visible forehead shape/size.
- `eyebrowShapeThickness`: eyebrow shape and thickness.
- `eyeColorEyeShape`: eye color impression and eye shape if visible.
- `noseShape`: visible nose shape.
- `cheekbonesCheeks`: cheekbone definition and cheek fullness.
- `lipsMouthShape`: mouth and lip shape.
- `beardMustacheColor`: beard/mustache color if visible.
- `beardMustacheStyleDensity`: beard/mustache style and density.
- `jawlineChinOverallStructure`: jawline, chin, and overall visible facial structure.

## Final reminder

This is visible trait extraction only.
Do not identify, compare, or name any real person.
