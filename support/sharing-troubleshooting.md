---
id: support-sharing-troubleshooting
title: Sharing Troubleshooting — Temporary Share Links
type: support
authority: canonical
status: current
owner: repository owner
summary: Diagnosing share-link problems — expiry, restarts, capacity, copy failures — and what the temporary-share design guarantees.
keywords: [support, share, share-links, ttl, expiry, 404, capacity, clipboard, restart]
contextTier: 2
relatedCode:
  [
    apps/api/src/modules/share-results/application/get-share-result.use-case.ts,
    apps/api/src/modules/share-results/infrastructure/in-memory-share-result-cache.repository.ts,
    apps/web/src/modules/game/containers/share-page.container.tsx,
  ]
relatedTests: [apps/api/src/tests/share-results.integration.test.ts, apps/web/e2e/share-flow.spec.ts]
relatedDocs: [docs/privacy-and-data-retention.md, support/error-code-catalog.md, support/FAQ.md]
readWhen: A player reports a share link that "doesn't work" or asks how sharing behaves.
---

# Sharing Troubleshooting — Temporary Share Links

## Design facts (what to lean on)

- A share link is a UUID URL (`/share/<uuid>`) whose payload lives **only in server memory** with a TTL — default 600 s / 10 minutes (`SHARE_RESULT_TTL_SECONDS`, `.env.example`; bounds 60–3600 s). There is no database (`apps/api/src/modules/share-results/infrastructure/in-memory-share-result-cache.repository.ts`).
- The shared payload is the safe result JSON only — the photo can never be in it; share creation re-scans every string and rejects embedded image data (`apps/api/src/modules/share-results/application/share-result-safety.service.ts`).
- Missing and expired links return the **identical 404** on purpose — no existence oracle (`apps/api/src/modules/share-results/application/get-share-result.use-case.ts`).
- An **API restart or redeploy clears all active share links** (single-instance in-memory driver). This is by design, not a bug.

## Symptom → cause → answer

| Symptom | Likely cause | Answer / action |
| --- | --- | --- |
| "This shared result has expired / is unavailable" (`share.expiredTitle` / `share.notFoundTitle`) | TTL elapsed (default 10 min), or the API restarted since creation, or the link was mistyped | Expected behavior. The player creates a fresh result; links are deliberately short-lived. |
| Links dying much sooner than the countdown suggested | API restart/redeploy during the window | Check deploy timeline; brief players via [communication-templates.md](./communication-templates.md) if a release just went out. |
| "We could not create a share link. Please try again." (`share.createFailed`) | Backend rejected the create: capacity cap (`SHARE_CAPACITY_REACHED` 429), payload cap (`SHARE_PAYLOAD_TOO_LARGE` 413), safety rejection (`SHARE_RESULT_UNSAFE` 400), or a transient failure | Retry once. Sustained 429s = capacity cap reached (`SHARE_RESULT_MAX_ACTIVE_ITEMS`); escalate to engineering — the cache never evicts live shares (`share-result-cache.service.ts`). A 400 `SHARE_RESULT_UNSAFE` should be escalated like a safety wording report ([escalation-matrix.md](./escalation-matrix.md)). |
| "Could not copy the link. Please copy it manually." (`share.copyFailed`) | Browser clipboard permission/API failure — client-side only | Player copies the visible URL manually; native share (`share.nativeShare`) may also work. |
| Wrong domain in the created link | `SHARE_RESULT_PUBLIC_BASE_URL` misconfigured (server config only, never user input) | Operational config issue — [../runbooks/config-change.md](../runbooks/config-change.md). |
| Player worried the link exposes their photo | It cannot — text-only payload, ingest rejects image data | Reassure with `share.modalDescription` copy: "Your photo is never shared." Details: [privacy-and-data-handling.md](./privacy-and-data-handling.md). |

## Rate limits

Create 20/min, read 120/min, delete 20/min per client (`apps/api/src/modules/share-results/model/share-result.constants.ts` throttles, per the module map). Bursts beyond that return the standard 429 envelope.
