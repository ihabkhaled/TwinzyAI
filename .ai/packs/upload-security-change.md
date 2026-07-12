<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: File upload validation chain

Task type: `upload-security-change` · Lane: **critical** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- Chain order is fixed: consent → presence → size → MIME/extension+consistency → magic bytes → decode → ClamAV.
- ClamAV fails CLOSED whenever enabled — any scanner error rejects the upload.
- Multer memory storage only; buffers are zero-filled, never written to disk.
- Caps come from env (MAX_IMAGE_SIZE_BYTES etc.), never hardcoded.

## Must-read docs

- rules/15-file-upload-security.md — > Related: [00-non-negotiable-rules.md](./00-non-negotiable-rules.md) (rules 33, 44, 47) · [06-security.md](./06-security.md) · [08-reliability-durability.md](./08-reliability-durability.md) (fail-closed, wipe in finally) · [26-error-han... (~283 tokens)
- docs/file-upload-security.md — Normative rules: rules/15-file-upload-security.md. Implementation: (~308 tokens)

## Rules

- rules/06-security.md — > The house standard for securing a privacy-first, anonymous, stateless product. Twinzy has **no accounts, no auth, no database** — the attack surface is the upload pipeline, the AI boundary, and the HTTP edge. Implements rules 30–35 of ... (~1519 tokens)
- rules/15-file-upload-security.md — > Related: [00-non-negotiable-rules.md](./00-non-negotiable-rules.md) (rules 33, 44, 47) · [06-security.md](./06-security.md) · [08-reliability-durability.md](./08-reliability-durability.md) (fail-closed, wipe in finally) · [26-error-han... (~283 tokens)

## Skills

- skills/secure-file-upload.md
- skills/security-review.md

## Reviewers

- agents/backend-security-reviewer.md

## Code entrypoints

- `apps/api/src/modules/file-security/`

## Validation before done

- `npm run test:file-security`
- `npm run test:security`

## Notes

Every change here needs npm run test:file-security and the security reviewer. Never reorder the chain for performance; consent stays first.
