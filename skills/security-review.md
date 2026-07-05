# Skill: Security Review

> Applies rules/06, 15. Output: docs/security-review-report.md.

1. Uploads: re-verify the full validation chain order and fail-closed ClamAV behavior.
2. Secrets: grep frontend bundle for keys; check images and compose for baked secrets.
3. Errors: confirm every thrown path maps to the safe envelope.
4. Headers/CORS/rate limits: verify live responses, not just code.
5. Logs: confirm no image bytes/keys/prompts-with-user-data.
6. Run npm run audit + Trivy scan; record findings and accepted risks in the report.
