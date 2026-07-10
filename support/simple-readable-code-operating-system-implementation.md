# Support Readiness — Simple Readable Code OS Implementation

## What changed

TwinzyAI processes a consented photo in memory for one trait-extraction call, destroys the source
buffer immediately afterward, and performs candidate generation, judging, translation, sharing,
and display from validated written data only. The game remains free and account-free.

## Common questions

- **Is my photo compared directly with public figures?** No. The photo is used only to extract
  visible, non-identifying written traits; later matching uses those written traits.
- **Is my photo stored or shared?** No. It is never written, logged, cached, returned, or included
  in a share link. Optional share links cache only the already-filtered result JSON for a short TTL.
- **Why can rankings differ from older runs?** The stricter text-only downstream boundary may
  change candidate ordering; this is intentional privacy hardening.
- **Does this identify me?** No. Identity, exact-lookalike, face-recognition, biometric, and
  sensitive-inference claims are forbidden and filtered.

## Escalation

Escalate any report of image persistence, image content in logs/share links, identity/biometric
wording, missing disclaimer, horizontal scrolling at 320 px, or repeated provider failures.
Capture timestamp, request id when available, locale, browser/device, and the safe error code—never
request or attach the player's photo.
