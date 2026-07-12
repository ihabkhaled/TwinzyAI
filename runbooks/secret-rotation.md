---
id: runbook-secret-rotation
title: Runbook — Secret Rotation (Gemini, PayPal, Provider Keys)
type: runbook
authority: canonical
status: current
owner: repository owner
summary: Rotating exposed or aging secrets — Gemini API key, PayPal REST credentials, and OpenAI-compatible provider keys — with verification and scanner sweep.
keywords: [runbook, secrets, rotation, gemini, paypal, api-keys, exposure, scanners, revoke]
contextTier: 2
relatedCode: [.env.example, apps/api/src/config/env.schema.ts, apps/api/src/config/app-config.service.ts]
relatedTests: [apps/api/src/config/env.schema.test.ts]
relatedDocs: [SECURITY.md, runbooks/security-incident.md, docs/env-vars.md]
readWhen: A secret was exposed, a rotation interval is due, or credentials change hands.
---

# Secret Rotation Runbook

## When to use this runbook

- A secret has been exposed in a chat transcript, log, screenshot, or shared history.
- A secret has been committed to version control (even if reverted).
- A team member with access to a secret leaves the project.
- Routine rotation interval is reached (quarterly for high-value keys).

## Owner

Security owner / DevOps owner.

## Steps

1. **Identify the exposed secret.** The backend secret inventory (all defined in `apps/api/src/config/env.schema.ts`; reference table in [`docs/env-vars.md`](../docs/env-vars.md)):
   - `GEMINI_API_KEY` — Google Gemini (required for real analyses)
   - `PAYPAL_CLIENT_ID` + `PAYPAL_CLIENT_SECRET` — PayPal REST app (paywall; blank = paywall off)
   - `{OPENAI,DEEPSEEK,QWEN,KIMI,GLM}_API_KEY` — optional AI providers (key presence = provider enabled)
2. **Revoke the old secret immediately.** Use the provider's console:
   - Google Gemini / Google AI Studio: delete or revoke the API key.
   - PayPal: developer.paypal.com → Apps & Credentials → the REST app → generate a new client secret / delete the app. Rotate **both** halves together; note `PAYPAL_ENV` (sandbox vs live) — credentials belong to exactly one environment (`apps/api/src/config/payment.constants.ts`).
   - OpenAI-compatible providers: revoke the key in that provider's dashboard; removing the key from the environment also disables the provider entirely (`isProviderEnabled`, `apps/api/src/config/app-config.service.ts`).
3. **Generate a new secret.** Create a replacement key in the same provider console.
4. **Update local `.env` files.** Replace the old value with the new one in every developer's `.env`.
   ```bash
   # .env
   GEMINI_API_KEY=your_new_key_here
   ```
5. **Update CI/CD / deployment secrets.** If the secret is stored in GitHub Actions, Docker secrets, or a vault, rotate it there.
6. **Update `.env.example` only if the placeholder changed.** Do not put the real secret in `.env.example`.
7. **Verify the new secret works.** Run:
   ```bash
   npm run build:shared
   npm run typecheck
   npm run test:unit
   ```
8. **Run the secret scanners.** Confirm the old secret no longer appears anywhere:
   ```bash
   npm run security:scan
   npm run security:scan:secrets
   ```
9. **Check git history.** If the secret was ever committed, consider rewriting history or rotating the secret as compromised regardless of reverts.
   ```bash
   git log --all --source --remotes -- '.env'
   git log -p --all -S '<old-secret-value>'
   ```
10. **Document the incident.** Update the risk register or create a postmortem if the exposure had operational impact.

## Rotation notes per secret

- **`GEMINI_API_KEY`**: rotating it briefly breaks analyses until the new key is live — expect `AI_PROVIDER_UNAVAILABLE` 502s in the gap ([provider-outage.md](./provider-outage.md)); nothing is lost, players retry.
- **PayPal credentials**: while either half is blank the paid gate is OFF and the game runs free (`isPaywallEnabled` requires both — `apps/api/src/config/app-config.service.ts`), which is a safe intermediate state. `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is public (not a secret) but must match the same REST app and is baked into the web build — rebuild the web image after changing it.
- **Provider keys**: removal is also the disable lever; routes skip disabled providers (`docs/provider-routing.md`). Verify route chains still have usable entries afterwards (boot-time validation throws on an explicit route with zero usable entries).

## Verify (after any rotation)

- API boots clean and `GET /api/v1/health` returns 200.
- One real analyze happy path if `GEMINI_API_KEY` rotated ([release-smoke-test.md](./release-smoke-test.md) §3).
- If PayPal rotated on a paywall-enabled deployment: create-order path returns an order id (`POST /api/v1/payments/orders`) and a capture-less analyze still 402s as designed.
- Scanners clean: `npm run security:scan` and `npm run security:scan:secrets`.

## Rollback

There is no rollback to an exposed secret — an exposed credential stays revoked. If the new secret is faulty, generate another; keeping the paywall halves blank (free game) is always a safe holding state.

## Prevention

- Never commit `.env` (it is already gitignored).
- Never paste secrets into chat transcripts or screenshots.
- Use `npm run security:scan:secrets` before pushing or releasing.
- Prefer a secret manager (1Password, Vault, etc.) over local `.env` files for production credentials.

## Communication

- If the secret was exposed externally, notify the security owner and relevant stakeholders.
- If the exposure was internal-only and the secret was rotated before any external access, a brief internal note is sufficient.
