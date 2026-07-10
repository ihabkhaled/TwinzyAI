# Support Readiness Template

## Summary

[What support needs to know about the change — new behavior, new error messages players may see, changed copy, changed limits (e.g. upload size).]

## Common Questions

- Question: [e.g. "Why was my photo rejected?"]
  Answer: [e.g. consent must be given, one photo only, under 5 MB, standard image format; rejections are safety features — pick another photo or retry]
- Question: [e.g. "Is my photo stored anywhere?"]
  Answer: No — never. Images are processed in memory only for trait extraction and are not saved. Optional share links hold only safety-filtered result JSON in a short-lived in-memory cache, never the photo.
- Question: [e.g. "The game says try again later — is my data lost?"]
  Answer: Nothing is lost (nothing is stored). The AI provider is temporarily unavailable; trying again later is the fix.

## Escalation Guidance

- When to escalate: [thresholds — e.g. multiple reports in a short window, the site unreachable, any identity/biometric-sounding wording reported]
- To whom / via what: [`runbooks/api-outage.md`](../runbooks/api-outage.md) for outages, [`runbooks/ai-provider-outage.md`](../runbooks/ai-provider-outage.md) for analyze failures; wording/safety reports go straight to the engineering/security owner
- Required evidence: timestamp, error message shown to the player, request id if available, device/browser if relevant

## Known Issues

- [Issue 1 — link the known-issues file for this release]
