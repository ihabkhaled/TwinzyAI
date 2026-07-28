# Architecture Review

The change stays inside the existing boundary:

`Gemini text -> provider-input normalizer -> strict shared Zod schema -> safety filter -> written
evidence -> text-only candidate/judge pipeline`.

Only extraction receives the image. The helper belongs to AI `lib`, not the controller or shared
public schema. No module boundary, endpoint, response contract, persistence, or external topology
changes. The prior ADR for text-only public-figure matching remains authoritative.

Decision: approved as a bounded adapter-boundary compatibility repair.

