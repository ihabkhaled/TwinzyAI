# Secret Rotation Runbook

## When to use this runbook

- A secret has been exposed in a chat transcript, log, screenshot, or shared history.
- A secret has been committed to version control (even if reverted).
- A team member with access to a secret leaves the project.
- Routine rotation interval is reached (quarterly for high-value keys).

## Owner

Security owner / DevOps owner.

## Steps

1. **Identify the exposed secret.** Confirm which provider and service it belongs to (e.g., `GEMINI_API_KEY` for Google Gemini).
2. **Revoke the old secret immediately.** Use the provider's console:
   - Google Gemini / Google AI Studio: delete or revoke the API key.
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

## Prevention

- Never commit `.env` (it is already gitignored).
- Never paste secrets into chat transcripts or screenshots.
- Use `npm run security:scan:secrets` before pushing or releasing.
- Prefer a secret manager (1Password, Vault, etc.) over local `.env` files for production credentials.

## Communication

- If the secret was exposed externally, notify the security owner and relevant stakeholders.
- If the exposure was internal-only and the secret was rotated before any external access, a brief internal note is sufficient.
