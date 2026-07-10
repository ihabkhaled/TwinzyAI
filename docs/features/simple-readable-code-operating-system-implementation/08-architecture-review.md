# 08 — Architecture Review

## Current architecture

- Backend: transport → application use case/service → adapters/infrastructure, with `model/` declarations and pure `lib/` helpers.
- Frontend: component → hook → service → gateway, with model/helpers and wrapped browser/vendor APIs.
- Shared: cross-side constants, schemas, enum maps, types, and pure utilities.
- Governance: `CLAUDE.md` lifecycle authority; architecture map + rules 00/28–30 engineering canon; skills procedural.

## Boundary and data-flow changes

The intended data flow becomes:

`image + consent → upload security → image-only trait extraction → validated written evidence → text-only generation → text-only judge → text-only translation/share/display`.

`AiImageInput` is removed from candidate/judge application contracts. HTTP contracts and result schemas do not change.

## Ownership impact

Existing owners are extended: AI step constants in config, AI service input types in module model, prompts in `modules/ai/prompts`, policy in rules/CLAUDE/mirrors, mobile layout in the responsible web primitive/component.

## ADR decision

No new architectural pattern is introduced. This request supersedes the 2026-07-09 multimodal pivot with a stricter privacy boundary; the decision is recorded in this feature set and canonical policy. A separate ADR is not required because it restores the repository's established adapter/type boundary.

## Architecture risks

Stale historical docs and multi-provider vision capability assumptions may reintroduce drift. Mitigation: canonical wording, route tests, provider-call modality tests, and owner-map references.

## Review result

Approved for implementation once phases 09–13 are complete. The approach narrows data exposure and preserves one-way layering.
