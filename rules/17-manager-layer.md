# 17 — Manager Layer

- One manager per use-case family (GameManager owns the analyze flow).
- Owns workflow sequence and cleanup guarantees (image wipe in finally).
- Calls services only; never repositories, adapters, SDKs, or HTTP req/res objects.
- Services never call managers. No god classes — split when a manager exceeds one use-case family.
