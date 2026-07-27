# Test Strategy

## Unit

Matching-profile classification/occlusion/counterfactuals; catalog search/lane merge/entity dedupe; median scoring/bonuses/penalties/quality caps; second-pass bound; participant degradation; entity resolution; Wikipedia/Commons mapping; URL allowlist; cache TTL/capacity; Arabic content validation; view-model/BiDi/modal behavior.

## Integration

Current text-only analyze path, advanced three/one/two-participant outcomes, invalid participant schema, missing enrichment/page/image, biography locale fallback, translation fallback, detail endpoint, and temporary share.

## Frontend/E2E

Arabic label/rank/name node ordering, `#10`, score isolation, RTL reasons, modal focus/Escape/restore, fallback/attribution/safe links/mobile layout, shared enriched result, and proof that no uploaded image enters result/share payloads.

## Negative/security

AI/user-controlled URLs, disallowed host/scheme/content/redirect/bytes, malformed JSON, unsupported license data, wrong-language Arabic, unsafe wording, endless second pass, minimum-participant failure, and provider-name leakage.

## Evidence

Targeted red/green tests per slice, touched-file coverage ≥95 statements/lines/functions and ≥90 branches, then every root gate and hook.

