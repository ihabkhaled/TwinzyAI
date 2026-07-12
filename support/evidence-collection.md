---
id: support-evidence-collection
title: Evidence Collection — What to Gather (and What Never to Collect)
type: support
authority: canonical
status: current
owner: repository owner
summary: The exact evidence support gathers before escalating, how engineering correlates it in logs, and the hard privacy limits on what may be collected.
keywords: [support, evidence, request-id, logs, correlation, screenshots, privacy, redaction]
contextTier: 2
relatedCode:
  [
    apps/api/src/core/logger/logger.constants.ts,
    apps/api/src/bootstrap/fastify-adapter.ts,
    apps/web/src/modules/game/helpers/stream-identity.helper.ts,
  ]
relatedTests: []
relatedDocs: [support/escalation-matrix.md, runbooks/safe-diagnostics.md]
readWhen: Preparing an escalation, or when tempted to ask a player for their photo — read the "never collect" list first.
---

# Evidence Collection

## Gather (per report)

| Item | Why / where it goes |
| --- | --- |
| Timestamp + timezone | Log window selection |
| Exact error copy shown (screenshot preferred) | Maps to an errorCode via [user-visible-error-guide.md](./user-visible-error-guide.md) |
| The "Step that failed: …" stage line, if shown | Localizes the failing pipeline stage |
| `errorCode` / `messageKey` if visible (devtools network tab, `ApiErrorResponse` envelope) | Direct lookup in [error-code-catalog.md](./error-code-catalog.md) |
| Request id, if available | Every API request carries a UUID id (`genReqId`, `apps/api/src/bootstrap/fastify-adapter.ts`); engineering greps all log lines for one request by that id (`runbooks/api-outage.md` §3) |
| Browser + device + OS, photo *format and size* (not the photo) | Reproduces upload/camera issues (HEIC, size caps) |
| Language in use (en/ar) and theme | Localization/RTL defects |
| Whether retry with the same photo worked | Distinguishes transient vs deterministic failures |
| Deployment context: was a release just shipped? donate/paywall enabled? | See [feature-catalog.md](./feature-catalog.md) |

## Engineering correlation (for the escalation ticket)

```bash
docker compose logs api | grep '"<request-id>"'
```

Structured pino JSON, one object per line; 4xx log as `warn`, 5xx as `error` (`apps/api/src/core/logger/http-logging.options.ts`). Full log-reading guidance: [`../runbooks/api-outage.md`](../runbooks/api-outage.md).

## NEVER collect

Hard limits — these protect the product's core privacy promise (see [privacy-and-data-handling.md](./privacy-and-data-handling.md) and [`../runbooks/safe-diagnostics.md`](../runbooks/safe-diagnostics.md)):

1. **Never ask for, accept, or store the player's photo.** Diagnosis needs the format/size/device, not the image. If a player attaches one unprompted, delete it and note "player-provided image deleted".
2. **Never collect secrets** — API keys, PayPal credentials, tokens, or full `Authorization`/cookie headers.
3. **Never paste raw provider responses or long base64 strings** into tickets — logs redact these on purpose (`apps/api/src/modules/privacy/lib/log-redaction.helpers.ts`); tickets must not become the leak.
4. **No identity data beyond what the player volunteers** for contact; there are no accounts to look up.

## Preserving incident evidence

For SEV-1/SEV-2, engineering snapshots logs before restarting anything:

```bash
docker compose logs api > api-incident-$(date +%Y%m%d-%H%M).log
```

(Procedure owned by [`../runbooks/api-outage.md`](../runbooks/api-outage.md) §4.) Support's job is the player-side evidence above plus timestamps; do not delay a SEV-1 escalation to complete the table.
